const { userRegisterHandler, userLoginHandler, userLogoutHandler, postPredictionHandler } = require('./handler');

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
    }
]

module.exports = routes;