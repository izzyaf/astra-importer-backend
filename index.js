import env from 'dotenv'
import Koa from 'koa'
import Router from '@koa/router'
import BodyParser from 'koa-bodyparser'
import Cors from '@koa/cors'
import Mongo from 'mongodb'

env.config()

const app = new Koa()
app.use(Cors())
app.use(BodyParser())
app.use(async (ctx, next) => {
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@astra-loggl.mongodb.net/test?retryWrites=true&w=majority`
    const client = new Mongo.MongoClient(uri, {useNewUrlParser: true})

    await client.connect()

    ctx.db = client.db(process.env.DB_NAME)

    await next()
})

const User = new Router()
User.post('/users', async (ctx, next) => {
    const {request: {body}, db} = ctx

    try {
        const result = await db.collection(process.env.DB_COLLECTION_USER).insertOne({
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
                stack: e.stack,
            }
        }
    }

    await next()
})

User.get('/users', async (ctx, next) => {
    const {db} = ctx
    const result = await db.collection(process.env.DB_COLLECTION_USER).find().toArray()

    ctx.status = 200
    ctx.body = {data: result}

    await next()
})

User.put('/users/:phoneNumber', async (ctx, next) => {
    const {db, params, request: {body}} = ctx

    const filter = {
        phoneNumber: params.phoneNumber
    }

    const result = await db.collection(process.env.DB_COLLECTION_USER).findOneAndReplace(filter, {...body, phoneNumber: params.phoneNumber }, { returnOriginal: false })

    if (result.ok) {
        ctx.status = 200
        ctx.body = result.value
    } else {
        ctx.status = 400
        ctx.body = {
            error: {
                code: result.lastErrorObject.code,
                message: result.lastErrorObject.message,
                stack: result.lastErrorObject.stack,
            }
        }
    }

    await next()
})

User.del('/users/:phoneNumber', async (ctx, next) => {
    const {db, params} = ctx

    const filter = {
        phoneNumber: params.phoneNumber.startsWith('+') ? params.phoneNumber : `+${params.phoneNumber}`
    }


    const result = await db.collection(process.env.DB_COLLECTION_USER).findOneAndDelete(filter)

    if (result.ok) {
        ctx.status = 204
        ctx.body = result.value
    } else {
        ctx.status = 400
        ctx.body = {
            error: {
                code: result.lastErrorObject.code,
                message: result.lastErrorObject.message,
                stack: result.lastErrorObject.stack,
            }
        }
    }

    await next()
})

app.use(User.routes())

app.listen(2222)

