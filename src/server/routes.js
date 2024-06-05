const { 
    userRegisterHandler, 
    userLoginHandler, 
    userLogoutHandler, 
    postPredictionHandler,
    getPredictionHandler 
} = require('./handler');

const routes = [
    {
        path: '/register',
        method: 'POST',
        handler: userRegisterHandler,
        options: {
            auth: false
        }
    },
    {
        path: '/login',
        method: 'POST',
        handler: userLoginHandler,
        options: {
            auth: false
        }
    },
    {
        path: '/logout',
        method: 'POST',
        handler: userLogoutHandler,
        options: {
            auth: false
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
                allow: 'multipart/form-data',
                maxBytes: 2 * 1024 * 1024, // 2MB file size limit
                multipart: true,
            }
        }
    },
    {
        path: '/prediction',
        method: 'GET',
        handler: getPredictionHandler
    }
]

module.exports = routes;