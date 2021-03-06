const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('../utils')

function post(parent, args, context, info) {
  const userId = getUserId(context)
  return context.db.mutation.createPatient(
    {
      data: {
        title: args.title,
        forname: args.forname,
        surname: args.surname,
        age: args.age,
        nhsnum: args.nhsnum,
      },
    },
    info,
  )
}


// Sign up and Login mutation, using passwrod hashing from jwt 
//============================================================
async function signup(parent, args, context, info) {

    //  Is encrypting the User’s password using the bcryptjs library 
    const password = await bcrypt.hash(args.password, 10)

    // Prisma binding instance to store the new User in the database
    const user = await context.db.mutation.createUser({
      data: { ...args, password },
    }, `{ id }`)
  
    // Generating a JWT which is signed with an APP_SECRET
    const token = jwt.sign({ userId: user.id }, APP_SECRET)
  
    // Return the token and the user
    return {
      token,
      user,
    }
  }
  
  async function login(parent, args, context, info) {

    // Prisma binding instance to retrieve the existing User record by the email address that was sent along in the login mutation
    const user = await context.db.query.user({ where: { userName: args.userName } }, ` { id password } `)
    if (!user) {
      throw new Error('No such user found')
    }
  
    // Compare the provided password with the one that is stored in the database
    const valid = await bcrypt.compare(args.password, user.password)
    if (!valid) {
      throw new Error('Invalid password')
    }
  
    const token = jwt.sign({ userId: user.id }, APP_SECRET)
  
    // Returning token and user
    return {
      token,
      user,
    }
  }
  
  module.exports = {
      signup,
      login
  }