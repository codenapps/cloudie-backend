import { Router } from "express";
import {
    resolveLocation,
    searchCities,
    searchCountries,
    searchStates,
} from "../controllers/GeoController.js";

const router = Router();

router.get("/countries", searchCountries);
router.get("/states/:countryCode", searchStates);
router.get("/cities/:countryCode/:stateCode", searchCities);
router.get("/resolve", resolveLocation);

export default router;
