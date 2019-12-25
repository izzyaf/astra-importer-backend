import Router from '@koa/router'

const User = new Router()

User.post('/users', async (ctx, next) => {
    const {
        request: { body },
        db
    } = ctx

    try {
        const result = await db
            .collection(process.env.DB_COLLECTION_USER)
            .insertOne({
                fullName: body.fullName,
                gender: body.gender,
                dateOfBirth: body.dateOfBirth,
                countryCode: body.countryCode || 'VN',
                password: body.password,
                phoneNumber: body.phoneNumber
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

User.get('/users', async (ctx, next) => {
    const { db } = ctx
    const result = await db
        .collection(process.env.DB_COLLECTION_USER)
        .find()
        .toArray()

    ctx.status = 200
    ctx.body = { data: result }

    await next()
})

User.put('/users/:phoneNumber', async (ctx, next) => {
    const {
        db,
        params,
        request: { body }
    } = ctx

    const filter = {
        phoneNumber: params.phoneNumber
    }

    const result = await db
        .collection(process.env.DB_COLLECTION_USER)
        .findOneAndReplace(filter, {
            ...body,
            phoneNumber: params.phoneNumber
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

User.del('/users/:phoneNumber', async (ctx, next) => {
    const { db, params } = ctx

    const filter = {
        phoneNumber: params.phoneNumber.startsWith('+')
            ? params.phoneNumber
            : `+${params.phoneNumber}`
    }

    const result = await db
        .collection(process.env.DB_COLLECTION_USER)
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

export default User
