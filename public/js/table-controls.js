document.addEventListener('DOMContentLoaded', function () {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
        const directors = table.querySelectorAll('.director-cell');
        
        // ============================================================
        // PRE-PROCESSING: Map Group IDs to Director Names
        // ============================================================
        // This allows us to filter by Director even on rows where the
        // Director cell is missing (spanned over).
        const directorMap = {
        };
        // We select all cells that have the group ID (single directors don't have .director-cell class but have the attribute)
        table.querySelectorAll('td[data-group-id]').forEach(cell => {
            const id = cell.dataset.groupId;
            directorMap[id] = cell.textContent.trim();
        });
        
        // ============================================================
        // HIGHLIGHTING LOGIC (Unchanged)
        // ============================================================
        table.addEventListener('mouseover', (e) => {
            if (e.target.closest('td:last-child')) {
                table.classList.add('show-col');
            }
            
            const directorCell = e.target.closest('.director-cell');
            
            if (directorCell) {
                directorCell.classList.add('highlight-row');
                const startRow = directorCell.parentElement;
                const spanCount = directorCell.rowSpan || 1;
                
                let currentRow = startRow;
                for (let i = 0; i < spanCount; i++) {
                    if (currentRow) {
                        currentRow.classList.add('highlight-row');
                        currentRow = currentRow.nextElementSibling;
                    }
                }
            } else {
                const row = e.target.closest('tr');
                if (row) {
                    row.classList.add('highlight-row');
                    
                    const currentDir = row.querySelector('.director-cell');
                    if (currentDir) {
                        currentDir.classList.add('highlight-row');
                    }
                    
                    let prevRow = row.previousElementSibling;
                    while (prevRow) {
                        const prevDir = prevRow.querySelector('.director-cell');
                        if (prevDir) {
                            const startIdx = prevRow.rowIndex;
                            const span = prevDir.rowSpan || 1;
                            if (row.rowIndex < startIdx + span) {
                                prevDir.classList.add('highlight-row');
                            }
                        }
                        prevRow = prevRow.previousElementSibling;
                    }
                }
            }
        });
        
        table.addEventListener('mouseout', (e) => {
            if (e.target.closest('td:last-child')) {
                if (!(e.relatedTarget && e.relatedTarget.closest('td:last-child'))) {
                    table.classList.remove('show-col');
                }
            }
            
            const row = e.target.closest('tr');
            if (row) {
                row.classList.remove('highlight-row');
            }
            
            const dirCell = e.target.closest('.director-cell');
            if (dirCell) {
                dirCell.classList.remove('highlight-row');
                const spanCount = dirCell.rowSpan || 1;
                let currentRow = dirCell.parentElement;
                for (let i = 0; i < spanCount; i++) {
                    if (currentRow) {
                        currentRow.classList.remove('highlight-row');
                        currentRow = currentRow.nextElementSibling;
                    }
                }
            }
            
            directors.forEach(d => d.classList.remove('highlight-row'));
        });
        
        // ============================================================
        // FILTERING LOGIC (Corrected for RowSpan Indexing)
        // ============================================================
        const selects = table.querySelectorAll('.filter-select');
        
        // Get reference column count from header
        const headerColCount = table.querySelectorAll('thead tr th').length;
        
        // Identify which column index is the "Director" column
        // We look for the first cell that has 'data-group-id' or class 'director-cell'
        // In your HTML, Director is usually index 2 (0=Storage, 1=Title, 2=Director)
        let directorColIndex = -1;
        const firstDirectorCell = table.querySelector('td[data-group-id]');
        if (firstDirectorCell) {
            directorColIndex = firstDirectorCell.cellIndex;
        }
        
        const applyTableFilters = () => {
            const allRows = table.querySelectorAll('tbody tr');
            const rowVisibility = new Map();
            
            // 1. Calculate Visibility
            allRows.forEach(row => {
                let showRow = true;
                
                selects.forEach(select => {
                    if (select.value === 'all') return;
                    
                    const visualColumnIndex = parseInt(select.getAttribute('data-column'));
                    const selectedValue = select.value;
                    
                    let cellText = "";
                    
                    // --- LOGIC: Handle Index Shifting ---
                    
                    // Case A: We are filtering by Director
                    // If the row is spanned, the cell might not exist.
                    if (visualColumnIndex === directorColIndex) {
                        const groupId = row.dataset.groupId;
                        cellText = directorMap[groupId] || "";
                    }
                    // Case B: We are filtering by a column AFTER the Director
                    // If the row is spanned (missing director cell), indices shift left by 1.
                    else if (row.cells.length < headerColCount && visualColumnIndex > directorColIndex) {
                        const actualIndex = visualColumnIndex - 1;
                        if (row.cells[actualIndex]) {
                            cellText = row.cells[actualIndex].innerText.trim();
                        }
                    }
                    // Case C: Normal Row or Column BEFORE Director
                    else {
                        if (row.cells[visualColumnIndex]) {
                            cellText = row.cells[visualColumnIndex].innerText.trim();
                        }
                    }
                    
                    // --- LOGIC: Filter Check ---
                    if (selectedValue === '') {
                        // Empty filter
                        if (cellText !== '') showRow = false;
                    } else {
                        // Contains filter
                        if (! cellText.toLowerCase().includes(selectedValue.toLowerCase())) {
                            showRow = false;
                        }
                    }
                });
                
                rowVisibility. set (row, showRow);
                
                if (showRow) {
                    row.classList.remove('hidden-row');
                } else {
                    row.classList.add('hidden-row');
                }
            });
            
            // 2. Fix RowSpans (Only for multi-row directors)
            // We iterate over cells with class 'director-cell' (which are the multi-row spanners)
            table.querySelectorAll('.director-cell').forEach(dCell => {
                const groupId = dCell.dataset.groupId;
                const groupRows = table.querySelectorAll(`tbody tr[data-group-id="${groupId}"]`);
                
                const visibleRows = Array. from (groupRows).filter(r => rowVisibility. get (r));
                const visibleCount = visibleRows.length;
                
                if (visibleCount === 0) {
                    dCell.rowSpan = 1;
                } else {
                    dCell.rowSpan = visibleCount;
                    const targetRow = visibleRows[0];
                    const currentParent = dCell.parentElement;
                    
                    if (currentParent !== targetRow) {
                        const colIndex = dCell.cellIndex;
                        if (targetRow.cells.length > colIndex) {
                            targetRow.insertBefore(dCell, targetRow.cells[colIndex]);
                        } else {
                            targetRow.appendChild(dCell);
                        }
                    }
                }
            });
        };
        
        selects.forEach(select => {
            select.addEventListener('change', applyTableFilters);
        });
    });
    // --- SINGLE BUTTON RANDOM PICKER LOGIC ---
    
    const randomBtn = document.getElementById('random-pick-btn');
    
    if (randomBtn) {
        randomBtn.addEventListener('click', function () {
            const table = document.querySelector('table');
            if (! table) return;
            
            // Check if we are in "Finder" mode (highlight already exists)
            const activeHighlight = table.querySelector('.random-highlight');
            
            if (activeHighlight) {
                // === FINDER MODE ===
                // Reset filters to ensure the row is visible
                const filterSelects = table.querySelectorAll('.filter-select');
                filterSelects.forEach(sel => sel.value = 'all');
                if (filterSelects.length > 0) {
                    filterSelects[0].dispatchEvent(new Event('change'));
                }
                
                // Scroll to the existing highlight
                setTimeout(() => {
                    activeHighlight.scrollIntoView({
                        behavior: 'smooth', block: 'center'
                    });
                },
                100);
            } else {
                // === PICKER MODE ===
                const stockRows = table.querySelectorAll('tbody tr.stock:not(.watched)');
                const stockCount = stockRows.length;
                
                if (stockCount === 0) {
                    alert("No unwatched films available!");
                    return;
                }
                
                // 1. Visual Feedback: Change to "Loading" dot
                randomBtn.textContent = ".";
                randomBtn.disabled = true;
                
                const url = `https://www.random.org/integers/?num=1&min=1&max=${stockCount}&col=1&base=10&format=plain`;
                
                fetch(url).then(response => response.text()).then(text => {
                    const randomIndex = parseInt(text.trim()) - 1; // 1-based to 0-based
                    const targetRow = stockRows[randomIndex];
                    
                    if (targetRow) {
                        // Clear previous highlights (safety check)
                        table.querySelectorAll('.random-highlight').forEach(r => r.classList.remove('random-highlight'));
                        
                        // Reset Filters
                        const filterSelects = table.querySelectorAll('.filter-select');
                        filterSelects.forEach(sel => sel.value = 'all');
                        if (filterSelects.length > 0) {
                            filterSelects[0].dispatchEvent(new Event('change'));
                        }
                        
                        // Apply Logic
                        setTimeout(() => {
                            targetRow.classList.add('random-highlight');
                            targetRow.scrollIntoView({
                                behavior: 'smooth', block: 'center'
                            });
                            
                            // 2. Switch Button to "Finder" mode
                            randomBtn.textContent = "↧";
                            randomBtn.classList.add('finder-mode');
                            randomBtn.disabled = false;
                        },
                        100);
                    }
                }). catch (error => {
                    console.error("Error fetching random number:", error);
                    alert("Could not connect to random.org.");
                    // Reset button on error
                    randomBtn.textContent = "⌘";
                    randomBtn.disabled = false;
                });
            }
        });
    }
});