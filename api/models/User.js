'use strict'

const Model = require('trails-model')

/**
 * @module User
 * @description user object defination
 */
module.exports = class User extends Model {

  static config() {}

  static schema() {
    return {
      email: {
        type: 'string',
        unique: true,
        email: true,
        required: true
      },
      passports: {
        collection: 'Passport',
        via: 'user'
      },
      username: {
        type: 'string',
        unique: true,
        min: 5,
        max: 15,
        required: true
      },
      imgsUrl: {
        model: 'Image'
      }
      // ,
      // surname: {
      //   type: 'string',
      //   required: true
      // },
      // lastname: 'string',
      // gender: {
      //   type: 'string',
      //   enum: ['male', 'female'],
      //   required: true
      // },
      // dob: {
      //   type: 'date',
      //   date: true
      // },
      // activate: {
      //   type: 'boolean'
      // }
    }
  }
}
