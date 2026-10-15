import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("Admin@123");
        System.out.println("HASH: " + hash);
        System.out.println("VERIFY: " + encoder.matches("Admin@123", hash));
    }
}
