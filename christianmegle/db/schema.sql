-- Priest applications
CREATE TABLE IF NOT EXISTS priests (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  display_name TEXT NOT NULL,
  email TEXT,
  quiz_score INTEGER NOT NULL,
  quiz_total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at TEXT,
  notes TEXT -- your notes on why approved/rejected
);

-- Bible quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  category TEXT NOT NULL DEFAULT 'scripture', -- scripture | weird | theology
  difficulty INTEGER NOT NULL DEFAULT 1 -- 1-3
);

-- Session logs (optional — confession content is NEVER stored)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  priest_id TEXT REFERENCES priests(id),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  ended_by TEXT CHECK (ended_by IN ('priest', 'sinner', 'disconnect')),
  duration_seconds INTEGER
);

-- Seed some quiz questions
INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_option, category, difficulty) VALUES
-- Real scripture
('How many days did God take to create the world?', '5', '6', '7', '40', 'b', 'scripture', 1),
('Who was swallowed by a great fish?', 'Moses', 'Jonah', 'Peter', 'David', 'b', 'scripture', 1),
('What is the shortest verse in the Bible?', 'God is love.', 'Jesus wept.', 'Amen.', 'Be still.', 'b', 'scripture', 1),
('How many plagues did God send on Egypt?', '7', '10', '12', '40', 'b', 'scripture', 1),
('Who denied Jesus three times?', 'Judas', 'Thomas', 'Peter', 'John', 'c', 'scripture', 2),
('What is the first book of the Bible?', 'Exodus', 'Psalms', 'Genesis', 'Matthew', 'c', 'scripture', 1),
('On which mountain did Moses receive the Ten Commandments?', 'Mount Zion', 'Mount Sinai', 'Mount Ararat', 'Mount Nebo', 'b', 'scripture', 2),
('What fruit is traditionally associated with the forbidden fruit, though never named in Genesis?', 'Fig', 'Pomegranate', 'Apple', 'Grape', 'c', 'scripture', 2),

-- Weird / vibes-based
('A stranger approaches you at a bus stop and says "I have sinned." What do you do?', 'Call the police', 'Listen with compassion', 'Offer them a pamphlet', 'Pretend you dont speak English', 'b', 'weird', 1),
('Which of these is NOT a real book of the Bible?', 'Obadiah', 'Hezekiah', 'Habakkuk', 'Nahum', 'b', 'weird', 2),
('If Jesus had a favorite meal, what would it be?', 'Bread and wine, obviously', 'Fish tacos', 'Whatever his mom made', 'He would fast', 'c', 'weird', 1),
('What is the proper response when someone confesses to eating their roommates leftovers?', '10 Hail Marys', 'Buy them new leftovers', 'Thats not a real sin', 'All sin is equal before God', 'd', 'weird', 1),
('A penitent confesses they feel nothing during prayer. What do you say?', 'Pray harder', 'God hears silence too', 'Maybe try a different religion', 'Thats between you and God', 'b', 'weird', 2),
('Can a dog go to heaven?', 'All dogs go to heaven', 'Only baptized dogs', 'Animals dont have souls', 'This is above my pay grade', 'a', 'weird', 1),

-- Theology
('What is the theological term for the study of the end times?', 'Soteriology', 'Eschatology', 'Pneumatology', 'Ecclesiology', 'b', 'theology', 3),
('Which church council established the Nicene Creed?', 'Council of Trent', 'First Council of Nicaea', 'Second Vatican Council', 'Council of Chalcedon', 'b', 'theology', 3),
('What does the Catholic concept of "transubstantiation" refer to?', 'The resurrection of the body', 'Bread and wine becoming Christs body and blood', 'The Holy Trinity', 'Baptismal transformation', 'b', 'theology', 2),
('In Catholic tradition, what is the "seal of the confessional"?', 'A wax stamp on confession records', 'The absolute secrecy a priest must maintain', 'The door of the confession booth', 'A prayer said after confession', 'b', 'theology', 2);
