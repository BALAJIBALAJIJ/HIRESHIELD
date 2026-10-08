package com.hireshield.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    /**
     * Upload a file to Cloudinary.
     * Returns a map containing "url" and "public_id".
     */
    public Map<String, String> uploadFile(MultipartFile file, String folder) throws IOException {
        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "hireshield/" + folder,
                        "resource_type", "auto"
                ));

        String url = (String) result.get("secure_url");
        String publicId = (String) result.get("public_id");

        return Map.of("url", url, "public_id", publicId);
    }

    /**
     * Upload a resume file with specific settings.
     */
    public Map<String, String> uploadResume(MultipartFile file) throws IOException {
        return uploadFile(file, "resumes");
    }

    /**
     * Upload a profile photo.
     */
    public Map<String, String> uploadProfilePhoto(MultipartFile file) throws IOException {
        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "hireshield/profiles",
                        "resource_type", "image",
                        "transformation", "w_400,h_400,c_fill,g_face"
                ));

        String url = (String) result.get("secure_url");
        String publicId = (String) result.get("public_id");
        return Map.of("url", url, "public_id", publicId);
    }

    /**
     * Upload a company logo.
     */
    public Map<String, String> uploadCompanyLogo(MultipartFile file) throws IOException {
        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "hireshield/logos",
                        "resource_type", "image"
                ));

        String url = (String) result.get("secure_url");
        String publicId = (String) result.get("public_id");
        return Map.of("url", url, "public_id", publicId);
    }

    /**
     * Delete a file from Cloudinary by its public ID.
     */
    public void deleteFile(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}
