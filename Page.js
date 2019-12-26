import Router from '@koa/router'
import Mongo from 'mongodb'

const Page = new Router()

Page.post('/pages', async (ctx, next) => {
    const {
        request: { body },
        db
    } = ctx

    const { owner, name, type, businessType } = body

    const foundUser = await db
        .collection(process.env.DB_COLLECTION_USER)
        .find({ _id: Mongo.ObjectId(owner) })
        .toArray()

    if (foundUser.length === 0) {
        ctx.status = 403
        ctx.body = {
            error: {
                message: 'User not found'
            }
        }

        return next()
    }

    try {
        const result = await db
            .collection(process.env.DB_COLLECTION_PAGE)
            .insertOne({
                owner,
                name,
                type,
                businessType
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

Page.get('/pages', async (ctx, next) => {
    const { db } = ctx
    const result = await db
        .collection(process.env.DB_COLLECTION_PAGE)
        .find()
        .toArray()

    ctx.status = 200
    ctx.body = { data: result }

    await next()
})

Page.put('/pages/:id', async (ctx, next) => {
    const {
        db,
        params,
        request: { body }
    } = ctx

    const foundUser = await db
        .collection(process.env.DB_COLLECTION_USER)
        .find({ _id: Mongo.ObjectId(body.owner) })
        .toArray()

    if (foundUser.length === 0) {
        ctx.status = 403
        ctx.body = {
            error: {
                message: 'User not found'
            }
        }

        return next()
    }

    const filter = {
        _id: Mongo.ObjectId(params.id)
    }

    const result = await db
        .collection(process.env.DB_COLLECTION_PAGE)
        .findOneAndReplace(
            filter,
            {
                ...body
            },
            {
                returnOriginal: false
            }
        )

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

Page.del('/pages/:id', async (ctx, next) => {
    const { db, params } = ctx

    const filter = {
        _id: Mongo.ObjectId(params.id)
    }

    const result = await db
        .collection(process.env.DB_COLLECTION_PAGE)
        .findOneAndDelete(filter)

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

export default Page
