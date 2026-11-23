package com.gr7.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.gr7.backend.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Lưu file CV (PDF/DOCX <= 5MB): ưu tiên đẩy lên Cloudinary, chưa cấu hình thì lưu local. */
@Service
public class FileStorageService {

    private static final long MAX_SIZE = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED = Set.of("pdf", "docx");

    private final Path root;
    private final Cloudinary cloudinary;

    public FileStorageService(
            @Value("${app.upload-dir:uploads}") String uploadDir,
            @Value("${app.cloudinary.cloud-name:}") String cloudName,
            @Value("${app.cloudinary.api-key:}") String apiKey,
            @Value("${app.cloudinary.api-secret:}") String apiSecret) {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
        if (!cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank()) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName.trim(),
                    "api_key", apiKey.trim(),
                    "api_secret", apiSecret.trim(),
                    "secure", true
            ));
        } else {
            this.cloudinary = null;
        }
    }

    /** Trả về URL tuyệt đối (https://res.cloudinary.com/...) hoặc đường dẫn local (/uploads/cv/...). */
    public String saveCv(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng chọn file CV");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File vượt quá dung lượng cho phép (5MB)");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        int dot = name.lastIndexOf('.');
        String ext = dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED.contains(ext)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ chấp nhận file PDF hoặc DOCX");
        }

        String rand = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String fileName = "cv_" + userId + "_" + rand + "." + ext;

        if (cloudinary != null) {
            try {
                Map<?, ?> uploaded = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "parttimesv/cv",
                                "public_id", fileName,
                                "resource_type", "raw",
                                "overwrite", true
                        )
                );
                return String.valueOf(uploaded.get("secure_url"));
            } catch (IOException e) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tải được CV lên Cloudinary, vui lòng thử lại");
            }
        }

        try {
            Path dir = root.resolve("cv");
            Files.createDirectories(dir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dir.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }
            return "/uploads/cv/" + fileName;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Không lưu được file, vui lòng thử lại");
        }
    }

    public Path getRoot() { return root; }
}