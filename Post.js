import Router from '@koa/router'
import Mongo from 'mongodb'

const Post = new Router()

Post.post('/posts', async (ctx, next) => {
    const { request: { body }, db } = ctx

    const {
        type,
        title,
        content,
        sharingTo,
        rating = 3.3,
        mediaIds,
        postedBy,
        postedIn
    } = body

    const foundUser = await db.collection(process.env.DB_COLLECTION_USER).find({ _id: Mongo.ObjectId(postedBy) }).toArray()

    if (foundUser.length === 0) {
        ctx.status = 403
        ctx.body = {
            error: {
                message: 'User not found'
            }
        }

        return next()
    }

    if (postedIn) {
        const foundPage = await db.collection(process.env.DB_COLLECTION_PAGE).find({ _id: Mongo.ObjectId(postedIn) }).toArray()

        if (foundPage.length === 0) {
            ctx.status = 403
            ctx.body = {
                error: {
                    message: 'Page not found'
                }
            }

            return next()
        }
    }

    try {
        const result = await db.collection(process.env.DB_COLLECTION_POST).insertOne({
            type,
            title,
            content,
            sharingTo,
            rating,
            mediaIds,
            owner: postedBy,
            pageId: postedIn
        })

        if (result.insertedCount === 1) {
            ctx.status = 200
            ctx.body = result.ops[0]
        }
    } catch (e) {
        ctx.status = 400
        ctx.body = {
            error: {
                code: e.code,
                message: e.message,
                stack: e.stack
            }
        }
    }

    await next()
})

Post.get('/posts', async (ctx, next) => {
    const { db } = ctx
    const result = await db.collection(process.env.DB_COLLECTION_POST).find().toArray()

    ctx.status = 200
    ctx.body = { data: result }

    await next()
})

Post.put('/posts/:id', async (ctx, next) => {
    const { db, params, request: { body } } = ctx

    const foundUser = await db.collection(process.env.DB_COLLECTION_USER).find({ _id: Mongo.ObjectId(body.postedBy) }).toArray()

    if (foundUser.length === 0) {
        ctx.status = 403
        ctx.body = {
            error: {
                message: 'User not found'
            }
        }

        return next()
    }

    if (body.postedIn) {
        const foundPage = await db.collection(process.env.DB_COLLECTION_PAGE).find({ _id: Mongo.ObjectId(body.postedIn) }).toArray()

        if (foundPage.length === 0) {
            ctx.status = 403
            ctx.body = {
                error: {
                    message: 'Page not found'
                }
            }

            return next()
        }
    }

    const filter = {
        _id: Mongo.ObjectId(params.id)
    }

    const result = await db.collection(process.env.DB_COLLECTION_POST).findOneAndReplace(filter, {
        ...body
    })

    if (result.ok) {
        ctx.status = 200
        ctx.body = result.value
    } else {
        ctx.status = 400
        ctx.body = {
            error: {
                code: result.lastErrorObject.code,
                message: result.lastErrorObject.message,
                stack: result.lastErrorObject.stack
            }
        }
    }

    await next()
})

Post.del('/posts/:id', async (ctx, next) => {
    const { db, params } = ctx

    const filter = {
        _id: Mongo.ObjectId(params.id)
    }

    const result = await db.collection(process.env.DB_COLLECTION_POST).findOneAndDelete(filter)

    if (result.ok) {
        ctx.status = 204
        ctx.body = result.value
    } else {
        ctx.status = 400
        ctx.body = {
            error: {
                code: result.lastErrorObject.code,
                message: result.lastErrorObject.message,
                stack: result.lastErrorObject.stack
            }
        }
    }

    await next()
})

export default Post
