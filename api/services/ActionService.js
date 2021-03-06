'use strict'


const Service = require('trails-service')
const ACTION = 'Action'
const co = require('co')

/**
 * @module ActionService
 * @description responsible for likes and views
 */
module.exports = class ActionService extends Service {

  test() {
    this.app.log.info('this is working')
  }
    // TODO: looks like am sorry for this waterfall paradim would refactor the code
    // to accomodate ES17 async and await for Info method
    // this module should expanded for more flexibity

  /**
   * create(req,res)
   * since Action is almost generic it has to implement
   * a check before creating action so has to avoid duplication.
   * creates a new action from the request and returns a response
   * of the newly created action back to the user.
   */
  create(req, res) {
    let model = this.app.services.GeneralService.model(req)
    const Action = this.app.orm.Action
    const creator = this.app.services.OrmService.create

    if (!this.santize(model)) {
      return res.status(400).json({
        mgs: 'invalid query or parameters provided'
      })
    }
    model = this.setProp(req, res, model)
    if (!model) {
      return res.status(400).json({
        mgs: 'invalid query or parameters provided'
      })
    }
    if (model.type === 'view' && model.owner === 'guest') {
      return creator(req, res, ACTION, this.santize, this.setProp)
    }
    return Action.findOne({
      owner: model.owner,
      type: ['like', 'dislike'],
      flour: model.flour
    })
      .then((data) => {
        if (data === undefined || data === {}) return this.genericAction(req, res, 'create', model)
        if (model.type !== data.type
          && model.owner === data.owner) return this.genericAction(req,res,'update', model, data )
        if (data !== {} ) return res.status(200).json(data)
      })
  }

  genericAction(req, res, oper, model, crietria) {
    const Action = this.app.orm.Action
    let query = Action[oper](model)
    if (oper === 'update') {
      query = Action.update(crietria, { type: model.type })
    }
    return query
      .then((data) => {
        res.status(200).json(data)
      })
      .catch( (err) => res.status(400).json(err))
  }


  /**
   * find(req, res)
   * returns a list of actions that matches the search query provided
   * by the request.
   */
  find(req, res) {
    return this.app.services.OrmService.find(req, res, ACTION)
  }

  /**
   * findOne(req, res)
   * resturns a single Action that matches the req params
   * ID in the url path.
   */
  findOne(req, res) {
    return this.app.services.OrmService.findOne(req, res, ACTION)
  }

  /**
   * update(req, res)
   * returns the new update action which has it id has
   * req.params.id
   */
  update(req, res) {
    const done = this.app.services.GeneralService.done
    return this.app.services.OrmService.update(req, res, ACTION, this.sanitize, this.setProp, done)
  }

  infoApi(req, res){
    let userId = ''
    if (req.user !== undefined) userId =  req.user.id
    return this.info(req.params.id, req.isAuthenticated(), userId)
      .then((result) => {
        res.status(200).json(result)
      }).catch( (err) => {
        res.status(500).json(err)
      })
  }

  /**
   * ActionService
   * Infos(req, res)
   * dependends on the ID parameters provided by the path
   * {req.params.id} to be specific. if tobe expanded
   * custom query would be allowed
   * this particular method creates a chain reaction that calculates the
   * total action info which include {likes, dislikes, views, bias }
   */
  info(id, authenticated, userId) {
    const Action = this.app.orm.Action
    const likes = 'like'
    const dislikes = 'dislike'
    return co.wrap(function*(app) {
      const result = {}

      // gets the total number of likes of infos app.services.RaccoonService.likedCount(id)
      result['likes'] = yield Action.count({ type: likes, flour: id })
      // gets the total number of items dislikes app.services.RaccoonService.dislikedCount(id)
      result['dislikes'] = yield Action.count({type: dislikes, flour: id})
      // gets the total amount of views the item has
      result['views'] = yield Action.count({
        id,
        type: 'view'
      })

      // if authorized get the user bias
      if (!authenticated) return result

      // map query to search for the latest user bias for like or dislike
      const query = {}
      query.owner = userId
      query.type = ['like', 'dislike']

      const bias = app.orm[Action].findOne(query)
        // map bias to result
      if (bias.type === 'like') {
        result['bais'] = true
        result['likedId'] = bias.id
      }
      if (bias.type !== 'like') {
        result['bais'] = false
      }

      return result
    })(this.app)

  }

  /**
   * sanitize(model)
   * takes in the model and checks if it meets certain requirements
   * if valid returns true else false.
   */
  santize(model) {
    return (!model.type || !model.flour) ? false : true
  }

  /**
   * setProp(req, res, model)
   * takes in the req, res, model objects and adds custom
   * properties to it before being added
   * if valid returns the model else returns undefined.
   */
  setProp(req, res, model) {
    model.owner = (req.isAuthenticated()) ? req.user.id : 'guest'
    if (model.type !== 'view') {
      return (req.isAuthenticated()) ? model : undefined
    }
    return model
  }
}
