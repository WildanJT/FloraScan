const { userRegisterHandler, userLoginHandler, postPredictHandler } = require('./handler');

const routes = [
    {
        path: '/register',
        method: 'POST',
        handler: userRegisterHandler
    },
    {
        path: '/login',
        method: 'POST',
        handler: userLoginHandler
    },
    {
        path: '/predict',
        method: 'POST',
        handler: postPredictHandler,
        //options: {
        //    payload: {
        //        allow: 'multipart/form-data',
        //        multipart: true,
        //    }
        //}
    }
]

module.exports = routes;