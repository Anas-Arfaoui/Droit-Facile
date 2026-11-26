package com.droitfacile;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class DroitFacileApplication {
    public static void main(String[] args) {
        SpringApplication.run(DroitFacileApplication.class, args);
    }
}
