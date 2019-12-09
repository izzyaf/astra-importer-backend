const HTTPClient = require('./HTTPClient')(process.env.API_URL)
const fixtures = require('./fixtures')

describe('Users API', () => {
    test('can create user', async () => {
        const input = fixtures.user()

        const [status, output] = await HTTPClient.createUser(input)

        expect(status).toEqual(200)
        expect(output).toMatchObject(input)

        expect.hasAssertions()
    })

    test('cannot create user with duplicate phone number', async () => {
        const [, thisUser] = await HTTPClient.createUser(fixtures.user())
        const [status, responseBody] = await HTTPClient.createUser(
            fixtures.user({phoneNumber: thisUser.phoneNumber})
        )

        expect(status).toEqual(400)
        expect(responseBody).toMatchInlineSnapshot(`
      Object {
        "error": Object {
          "code": 11000,
          "message": "E11000 duplicate key error collection: importer.users index: phoneNumber dup key: { : \\"+84268345213\\" }",
          "stack": "MongoError: E11000 duplicate key error collection: importer.users index: phoneNumber dup key: { : \\"+84268345213\\" }
          at Function.create (/Users/minh/Work/astra-importer-backend/node_modules/mongodb/lib/core/error.js:44:12)
          at toError (/Users/minh/Work/astra-importer-backend/node_modules/mongodb/lib/utils.js:150:22)
          at /Users/minh/Work/astra-importer-backend/node_modules/mongodb/lib/operations/common_functions.js:266:39
          at handler (/Users/minh/Work/astra-importer-backend/node_modules/mongodb/lib/core/topologies/replset.js:1209:22)
          at /Users/minh/Work/astra-importer-backend/node_modules/mongodb/lib/core/connection/pool.js:414:18
          at processTicksAndRejections (internal/process/task_queues.js:79:11)",
        },
      }
    `)
        expect.hasAssertions()
    })

    test('can get users', async () => {
        const _ = await HTTPClient.createUser(fixtures.user())

        const [status, responseBody] = await HTTPClient.getUsers()

        expect(status).toEqual(200)
        expect(responseBody).toHaveProperty('data')
        expect(responseBody.data.length).toBeGreaterThanOrEqual(1)

        expect.hasAssertions()
    })

    test('can delete user', async () => {
        const [, user] = await HTTPClient.createUser(fixtures.user())

        const [status] = await HTTPClient.deleteUser(user.phoneNumber)

        expect(status).toEqual(204)
    })
})
