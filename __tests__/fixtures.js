const randomString = () => {
    return Math.random().toString(36).substring(2, 15)
}

const randomInt = (min, max) => {
    const roundedMin = Math.ceil(min);
    const roundedMax = Math.floor(max);

    return Math.floor(Math.random() * (roundedMax - roundedMin)) + roundedMin; //The maximum is exclusive and the minimum is inclusive
}

const user = (data = {}) => {
    return {
        fullName: data.fullName || randomString(),
        gender: data.gender || 'MALE',
        dateOfBirth: data.dateOfBirth || '1994-01-01T09:20:17.463Z',
        password: data.password || 'qweasdzxc',
        phoneNumber: data.phoneNumber || '+84' + `${randomInt(100000000, 999999999)}`
    }
}

module.exports = ({
    user
})