-- Migration: Replace all quiz questions with new set
-- Run this to update an existing database

-- Delete old questions
DELETE FROM quiz_questions;

-- Reset autoincrement
DELETE FROM sqlite_sequence WHERE name='quiz_questions';

-- Insert new questions
INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_option, category, difficulty) VALUES

-- Sin and Redemption
('What was the first sin in the Bible, commonly understood to be?', 'Being a woman', 'Eating from the Tree of the Knowledge of Good and Evil', 'Being naked and ashamed', 'Eating Gods favorite goat in Eden', 'b', 'sin_redemption', 1),
('Which biblical ruler was most lecherous? (Letting a love of women come between oneself and God)', 'Caesar', 'Solomon', 'David', 'Nebuchadnezzar', 'b', 'sin_redemption', 2),
('In the parable of the prodigal son, how does the father respond when his son returns, desolate and disgraced?', 'He calls the Pharisees on him', 'He offers him indentured servitude', 'He slaughters a fattened calf', 'He gives him a quest for the heads of 10 Philistines', 'c', 'sin_redemption', 1),
('In the Old Testament Passover, what protected the Israelites from judgment?', 'Having the blood of Gods chosen people in their veins', 'The blood smeared on the doorposts', 'Mezuzahs', 'Prayer', 'b', 'sin_redemption', 2),
('What animal is especially associated with bearing sin away on the Day of Atonement?', 'Dove', 'Goat', 'Pangolin', 'Nephilim', 'b', 'sin_redemption', 1),
('Who was the first murderer recorded in the Bible, and whom did he kill?', 'Adam; killed Eve', 'Cain; killed Abel', 'Eve; killed Lilith', 'Satan; killed the vibe', 'b', 'sin_redemption', 1),
('After Adam and Eve sin, what do they do first?', 'Eat the snake', 'Hide from God', 'Dance', 'Blame Rome', 'b', 'sin_redemption', 1),

-- Scripture
('How many days did God take to create the world?', '5', '6', '7', '40 days and 40 nights', 'b', 'scripture', 1),
('Who was swallowed by a great fish?', 'Lucifer', 'Jonah', 'Jesus', 'Your mom', 'b', 'scripture', 1),
('What is the shortest verse in the Bible?', 'Jesus wept.', 'He said.', 'Be clean!', 'I am.', 'a', 'scripture', 1),
('What happened after Simon-Peter denied Jesus?', 'Judas kissed him', 'He denied him 2 more times', 'His ear was cut off', 'The rooster crowed', 'd', 'scripture', 2),
('What is the third book of the Bible?', 'The Revelations of John', 'Jebediah', 'Leviticus', 'Mary Magdalene', 'c', 'scripture', 1),
('On which mountain did Moses receive the Ten Commandments?', 'Mount Zion', 'Mount Sinai', 'Mount Ararat', 'Mount Nebo', 'b', 'scripture', 2),
('What fruit is traditionally associated with the forbidden fruit, though it is never named in Genesis?', 'Durian', 'Pomegranate', 'Apple', 'Grape', 'c', 'scripture', 2),

-- Weird / Vibes
('A stranger approaches you at a bus stop and says, "I have sinned." What do you do?', 'Call the police', 'Listen with compassion', 'Recommend Christianmegle', 'Pretend you dont speak English', 'b', 'weird', 1),
('Which of these is NOT a real book of the Bible?', 'Ruth', 'Zion', 'Habakkuk', 'Job', 'b', 'weird', 2),
('If Jesus had a favorite meal, what would it be?', 'Bread and wine, body and blood', 'Figs and olives', 'Simon Peters famous hummus', 'He would fast', 'd', 'weird', 1),
('What is the proper response when someone confesses to eating their roommates leftovers?', '10 Hail Marys', 'Jesus fasted, so can you.', 'Thats not a real sin', 'All sin is equal before God', 'd', 'weird', 1),
('Can a dog go to heaven?', 'All dogs go to heaven', 'Only baptized dogs', 'No, there are too many cats in heaven for that to count as heaven', 'This is above my pay grade', 'a', 'weird', 1),

-- Theology
('What is the theological term for the study of the end times?', 'Soteriology', 'Eschatology', 'Pneumatology', 'Ecclesiology', 'b', 'theology', 3),
('Which church council established the Nicene Creed?', 'Council of Ephesus', 'First Council of Nicaea', 'Council of Trent', 'Synod of Dort', 'b', 'theology', 3),
('In Catholic tradition, what is the "seal of the confessional"?', 'A wax stamp on confession records', 'The absolute secrecy a priest must maintain', 'The door of the confession booth', 'A prayer said after confession', 'b', 'theology', 2),
('What are the Sibylline Oracles?', 'The private diary of the Cumaean Sibyl', 'A collection of Jewish and Christian prophetic texts written in the voice of a sibyl', 'A lost gnostic gospel written by the Oracle of Delphi', 'An anthology of Paul of Tarsus lost beat poetry', 'b', 'theology', 3);
