DELIMITER $$
CREATE TRIGGER players_insert
AFTER INSERT ON players 
FOR EACH ROW
BEGIN
UPDATE updates set `last_update`=now() where `id`=1;
END$$
DELIMITER ;