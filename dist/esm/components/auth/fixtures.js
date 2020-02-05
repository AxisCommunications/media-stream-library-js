export const credentials = {
    username: 'Mufasa',
    password: 'Circle Of Life',
};
export const request = {
    method: 'GET',
    uri: '/dir/index.html',
};
export const cnonce = '0a4f113b';
export const authHeaders = {
    'WWW-Authenticate': 'WWW-Authenticate: Digest realm="Test realm@host.com", \
qop="auth,auth-int", \
nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", \
opaque="5ccc069c403ebaf9f0171e9517f40e41"',
    Authorization: 'Digest username="Mufasa", realm="Test realm@host.com", \
nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", \
uri="/dir/index.html", \
qop=auth, \
nc=00000001, \
cnonce="0a4f113b", \
response="e53a925871f91ac8c6169f94c3eba658", \
opaque="5ccc069c403ebaf9f0171e9517f40e41"',
};
//# sourceMappingURL=fixtures.js.map