const CREDENTIALS = {
    username: 'foxle',
    password: '7. Rich in hay;'
};

export async function onRequest(context) {
    const authHeader = context.request.headers.get('Authorization');
    
    if (!authHeader || !isValid(authHeader)) {
        return new Response('Unauthorized', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Catalogue", charset="UTF-8"',
                'Content-Type': 'text/plain'
            }
        });
    }
    
    return context.next();
}

function isValid(header) {
    const encoded = header.replace('Basic ', '');
    const decoded = atob(encoded);
    const [user, pass] = decoded.split(':');
    return user === CREDENTIALS.username && pass === CREDENTIALS.password;
}
