const { Router } = require("express");
const {
  optionalInt,
  optionalObject,
  optionalString,
  optionalStringList,
  requiredString,
} = require("./validate");
const {
  analyzeMission,
  buildMissions,
  buildQuests,
  easierMission,
  environmentFor,
  hintFor,
  newId,
  summaryFor,
} = require("./mocks");

const router = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, message: "Scavvy is awake and sniffing around." });
});

router.post("/adventure/start", (req, res) => {
  const name = optionalString(req.body, "name", { max: 40, fallback: "Explorer" });
  const personality = optionalString(req.body, "personality", { max: 32, fallback: "explorer" });
  const style = optionalString(req.body, "style", { max: 32, fallback: "RANDOM" });
  res.json({
    id: newId(),
    name,
    personality,
    style,
    missions: buildMissions(style),
  });
});

router.post("/mission/analyze", (req, res) => {
  const missionTitle = requiredString(req.body, "mission_title");
  const missionIndex = optionalInt(req.body, "mission_index", { min: 0, max: 20, fallback: 0 });
  const difficulty = optionalString(req.body, "difficulty", { max: 16, fallback: "Easy" });
  const attempt = optionalInt(req.body, "attempt", { min: 1, max: 10, fallback: 1 });
  res.json(analyzeMission({ missionTitle, missionIndex, difficulty, attempt }));
});

router.post("/mission/easier", (req, res) => {
  requiredString(req.body, "mission_title");
  res.json(easierMission());
});

router.post("/environment/analyze", (req, res) => {
  const locationType = optionalString(req.body, "location_type", { max: 40, fallback: "Home" });
  optionalStringList(req.body, "images", { maxItems: 3 });
  res.json({ environment: environmentFor(locationType), source: "mock" });
});

router.post("/environment/quests", (req, res) => {
  const locationType = optionalString(req.body, "location_type", { max: 40, fallback: "Home" });
  const environment = optionalObject(req.body, "environment") ?? environmentFor(locationType);
  res.json({ quests: buildQuests(environment), source: "mock" });
});

router.post("/quest/validate", (req, res) => {
  const missionTitle = requiredString(req.body, "mission_title");
  optionalObject(req.body, "environment");
  const attempt = optionalInt(req.body, "attempt", { min: 1, max: 10, fallback: 1 });
  const difficulty = optionalString(req.body, "difficulty", { max: 16, fallback: "Easy" });
  res.json(analyzeMission({ missionTitle, difficulty, attempt }));
});

router.post("/quest/hint", (req, res) => {
  requiredString(req.body, "mission_title");
  const environment = optionalObject(req.body, "environment");
  const hintLevel = optionalInt(req.body, "hint_level", { min: 1, max: 3, fallback: 1 });
  res.json({ hint: hintFor(environment, hintLevel) });
});

router.post("/adventure/summary", (req, res) => {
  const name = optionalString(req.body, "name", { max: 40, fallback: "Explorer" });
  const personality = optionalString(req.body, "personality", { max: 32, fallback: "explorer" });
  const style = optionalString(req.body, "style", { max: 32, fallback: "RANDOM" });
  const missionsCompleted = optionalInt(req.body, "missions_completed", {
    min: 0,
    max: 20,
    fallback: 3,
  });
  const totalXp = optionalInt(req.body, "total_xp", { min: 0, max: 100000, fallback: 300 });
  res.json(summaryFor({ name, personality, style, missionsCompleted, totalXp }));
});

router.get("/voice", (_req, res) => {
  res.status(204).end();
});

module.exports = { router };
