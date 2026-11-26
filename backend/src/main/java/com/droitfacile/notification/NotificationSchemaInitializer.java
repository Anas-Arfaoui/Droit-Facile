package com.droitfacile.notification;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

/** Keeps the notification type constraint compatible with all supported notification types. */
@Component
public class NotificationSchemaInitializer implements CommandLineRunner {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public NotificationSchemaInitializer(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            if (!connection.getMetaData().getDatabaseProductName().toLowerCase().contains("postgresql")) {
                return;
            }
        }

        jdbcTemplate.execute("ALTER TABLE notification DROP CONSTRAINT IF EXISTS notification_type_check");
        jdbcTemplate.execute("ALTER TABLE notification ADD CONSTRAINT notification_type_check "
                + "CHECK (type IN ('RAPPEL_ECHEANCE', 'MESSAGE_ADMIN'))");
    }
}
