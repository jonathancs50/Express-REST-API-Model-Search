const express = require("express");
const modelController = require("../controllers_OR_routehandlers/modelController");
const authController = require("../controllers_OR_routehandlers/authController");

const router = express.Router();

//This param middleware (4 arguments)only runs after all the middlewares in app.js
// router.param("modelID", modelController.checkID);

//ALIASING
//we add middleware to munipulate the query string
router
  .route("/top-5-youngest")
  .get(modelController.aliasTopYoung, modelController.getAllModels);

//Agregation pipeline
router.route("/stats").get(modelController.getModelStats);
router.route("/skills/:age").get(modelController.getSkills);

router
  .route("/")
  .get(authController.protect, modelController.getAllModels)
  .post(modelController.createModel);

router
  .route("/:id")
  .get(modelController.getModel)
  .patch(modelController.updateModel)
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    modelController.deleteModel
  );
module.exports = router;
