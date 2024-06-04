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
            /*payload: {
                allow: 'multipart/form-data',
                multipart: true,
            },*/
        }
    },
    {
        path: '/prediction',
        method: 'GET',
        handler: getPredictionHandler
    }
]

module.exports = routes;