import { constants } from "fs";
import { access, readFile } from "fs/promises";

export default async function getResults(req, res) {
    //expID
    const { expID } = req.query;
    if (expID) {
        try {
            await access("public/experiments/" + expID + ".json");
        } catch (error) {
            res.status(500).end();
            return;
        }
        // Load file
        const data = await readFile(
            "public/experiments/" + expID + ".json",
            "utf8"
        );
        res.json(JSON.parse(data));
    } else {
        res.status(500).json();
    }
}
