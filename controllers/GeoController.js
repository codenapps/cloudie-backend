import { City, Country, State } from "country-state-city";

const MAX_RESULTS = 50;

const norm = (q) => (q || "").trim().toLowerCase();

const mapLimit = (list, mapper) => list.slice(0, MAX_RESULTS).map(mapper);

export const searchCountries = (req, res) => {
    try {
        const q = norm(req.query.q);
        let countries = Country.getAllCountries();
        if (q) {
            countries = countries.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.isoCode.toLowerCase().includes(q)
            );
        }
        countries.sort((a, b) => a.name.localeCompare(b.name));
        return res.json({
            data: mapLimit(countries, (c) => ({
                name: c.name,
                isoCode: c.isoCode,
            })),
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load countries" });
    }
};

export const searchStates = (req, res) => {
    try {
        const countryCode = (req.params.countryCode || "").toUpperCase();
        if (!countryCode) {
            return res.json({ data: [] });
        }
        const q = norm(req.query.q);
        let states = State.getStatesOfCountry(countryCode) || [];
        if (q) {
            states = states.filter(
                (s) =>
                    s.name.toLowerCase().includes(q) ||
                    s.isoCode.toLowerCase().includes(q)
            );
        }
        states.sort((a, b) => a.name.localeCompare(b.name));
        return res.json({
            data: mapLimit(states, (s) => ({
                name: s.name,
                isoCode: s.isoCode,
                countryCode: s.countryCode,
            })),
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load states" });
    }
};

export const searchCities = (req, res) => {
    try {
        const countryCode = (req.params.countryCode || "").toUpperCase();
        const stateCode = (req.params.stateCode || "").toUpperCase();
        if (!countryCode || !stateCode) {
            return res.json({ data: [] });
        }
        const q = norm(req.query.q);
        let cities = City.getCitiesOfState(countryCode, stateCode) || [];
        if (q) {
            cities = cities.filter((c) => c.name.toLowerCase().includes(q));
        }
        cities.sort((a, b) => a.name.localeCompare(b.name));
        return res.json({
            data: mapLimit(cities, (c) => ({
                name: c.name,
                countryCode: c.countryCode,
                stateCode: c.stateCode,
            })),
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load cities" });
    }
};

export const resolveLocation = (req, res) => {
    try {
        const countryCode = (req.query.country || "").toUpperCase();
        const stateCode = (req.query.state || "").toUpperCase();
        const cityName = req.query.city || "";

        const country = countryCode
            ? Country.getCountryByCode(countryCode)
            : undefined;
        const state =
            countryCode && stateCode
                ? State.getStateByCodeAndCountry(stateCode, countryCode)
                : undefined;

        return res.json({
            data: {
                country: countryCode,
                countryName: country?.name || countryCode || "",
                state: stateCode,
                stateName: state?.name || stateCode || "",
                city: cityName,
                cityName: cityName,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to resolve location" });
    }
};
