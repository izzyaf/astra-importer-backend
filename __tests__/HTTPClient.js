const fetch = require('node-fetch')

module.exports = (host) => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    const handleResponse = async response => {
        const responseBody = await response.text()

        try {
            const responseJson = JSON.parse(responseBody)

            return [response.status, responseJson]
        } catch (_) {
            void 0
        }

        return [response.status, responseBody]
    }

    const create = (path) => (payload) => {
        return fetch(`${host}/${path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        }).then(handleResponse)
    }

    const get = path => id => {
        const uri = `${host}/${path}`

        return fetch(id ? `${uri}/${id}` : uri, {
            method: 'GET',
            headers,
        }).then(handleResponse)
    }

    const put = path => (id, payload) => {
        return fetch(`${host}/${path}/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload)
        }).then(handleResponse)
    }

    const del = path => id => {
        return fetch(`${host}/${path}/${id}`, {
            method: 'DELETE',
            headers,
        }).then(handleResponse)
    }


    return {
        createUser: create('users'),
        getUsers: get('users'),
        updateUsers: put('users'),
        deleteUser: del('users'),

        createPage: create('pages'),
        getPages: get('pages'),
        updatePages: put('pages'),
        deletePage: del('pages'),

        createPost: create('posts'),
        getPosts: get('posts'),
        updatePosts: put('posts'),
        deletePost: del('posts'),
    }
}