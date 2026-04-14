const CREDENTIALS = {
    username: 'afuchs',
    password: 'Rich in hay.'
};

export default {
    async fetch(request, env, ctx) {
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !isValid(authHeader)) {
            return new Response('Unauthorized', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Catalogue", charset="UTF-8"',
                    'Content-Type': 'text/plain'
                }
            });
        }
        
        // Auth passed — fetch the actual page from Pages
        return fetch(request);
    }
};

function isValid(header) {
    const encoded = header.replace('Basic ', '');
    const decoded = atob(encoded);
    const [user, pass] = decoded.split(':');
    return user === CREDENTIALS.username && pass === CREDENTIALS.password;
}
