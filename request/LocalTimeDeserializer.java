package edu.lms.dto.request;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.time.LocalTime;

public class LocalTimeDeserializer extends JsonDeserializer<LocalTime> {

    @Override
    public LocalTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);

        // Case 1: String format "HH:mm"
        if (node.isTextual()) {
            String timeStr = node.asText();
            if (timeStr.contains(":")) {
                try {
                    String[] parts = timeStr.split(":");
                    int hour = Integer.parseInt(parts[0]);
                    int minute = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
                    return LocalTime.of(hour, minute);
                } catch (Exception e) {
                    throw new IOException("Invalid time format: " + timeStr + ". Expected HH:mm", e);
                }
            }
        }

        // Case 2: Object format {hour, minute, second, nano}
        if (node.isObject()) {
            int hour = node.has("hour") ? node.get("hour").asInt() : 0;
            int minute = node.has("minute") ? node.get("minute").asInt() : 0;
            int second = node.has("second") ? node.get("second").asInt() : 0;
            int nano = node.has("nano") ? node.get("nano").asInt() : 0;
            return LocalTime.of(hour, minute, second, nano);
        }

        // Case 3: Number (seconds since midnight)
        if (node.isNumber()) {
            long totalSeconds = node.asLong();
            int hour = (int) (totalSeconds / 3600);
            int minute = (int) ((totalSeconds % 3600) / 60);
            int second = (int) (totalSeconds % 60);
            return LocalTime.of(hour, minute, second);
        }

        throw new IOException("Cannot deserialize LocalTime from: " + node.toString());
    }
}

