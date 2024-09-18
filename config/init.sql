USE ndn_logs;

CREATE TABLE packet_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(255),
    name VARCHAR(1024),
    packet_type INT,
    source_ip VARCHAR(45),
    destination_ip VARCHAR(45),
    received_time DATETIME
);
