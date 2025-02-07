import { Router } from "express";

import postLogin from "./authentication/post.login";
import getCheck from "./authentication/get.check";

import getProfile from "./user/get.profile";

import getPlotGroups from "./plots/get.plot-groups";
import postPlotGroups from "./plots/post.plot-groups";
import deletePlotGroups from "./plots/delete.plot-groups";
import postPlot from "./plots/post.plot";
import deletePlot from "./plots/delete.plot";
import syncPlots from "./plots/post.sync";

import saveData from "./data-collection/post.save-data";

const router = Router();

router.use(postLogin);
router.use(getCheck);

router.use(getProfile);

router.use(getPlotGroups);
router.use(postPlotGroups);
router.use(deletePlotGroups);
router.use(postPlot);
router.use(deletePlot);
router.use(syncPlots);

router.use(saveData);

export default router;
