const { 
    userRegisterHandler, 
    userLoginHandler, 
    userLogoutHandler, 
    getNewsHandler,
    postPredictionHandler,
    getPredictionHandler, 
    deletePredictionHandler,
} = require('./handler');

const routes = [
    {
        path: '/',
        method: 'GET',
        handler: (request, h) => {
            return ('<h1>FloraScan is Running<h1>');
        },
        options: {
            auth: false,
        }
    },
    {
        path: '/register',
        method: 'POST',
        handler: userRegisterHandler,
        options: {
            auth: false,
        }
    },
    {
        path: '/login',
        method: 'POST',
        handler: userLoginHandler,
        options: {
            auth: false,
        }
    },
    {
        path: '/logout',
        method: '*',
        handler: userLogoutHandler,
        options: {
            auth: false,
        }
    },
    {
        path: '/news',
        method: 'GET',
        handler: getNewsHandler,
        options: {
            auth: false,
        }
    },
    {
        path: '/prediction',
        method: 'POST',
        handler: postPredictionHandler,
        options: {
            payload: {
                output: 'stream',
                parse: true,
                multipart: true,
                allow: 'multipart/form-data',
                maxBytes: 2 * 1024 * 1024, // 2MB file size limit
            }
        }
    },
    {
        path: '/prediction',
        method: 'GET',
        handler: getPredictionHandler
    },
    {
        path: '/prediction',
        method: 'DELETE',
        handler: deletePredictionHandler
    }
]

module.exports = routes;