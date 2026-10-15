TRƯỜNG ĐẠI HỌC QUY NHƠN

KHOA CÔNG NGHỆ THÔNG TIN

ĐỀ CƯƠNG

KHÓA LUẬN TỐT NGHIỆP



I. Đặt vấn đề

Lý do chọn đề tài

Trong bối cảnh công nghiệp phần mềm hiện đại, quy trình phát triển linh hoạt (Agile) và phân phối liên tục (CI/CD) đòi hỏi tốc độ phát hành sản phẩm nhanh nhưng vẫn phải đảm bảo chất lượng tuyệt đối. Để làm được điều này, kiểm thử đơn vị (Unit Testing) đóng vai trò cốt lõi giúp phát hiện lỗi sớm ngay từ giai đoạn lập trình. Tuy nhiên, nguyên tắc sống còn của Unit Test là tính "cô lập". Một đơn vị mã (hàm, lớp) cần được kiểm thử hoàn toàn độc lập với các hệ thống bên ngoài.

Trên thực tế, các ứng dụng phần mềm hiện nay có kiến trúc rất phức tạp, thường xuyên phải giao tiếp với cơ sở dữ liệu, API hoặc hệ thống tệp tin. Việc chạy Unit Test trực tiếp với các môi trường thật này gây ra nhiều rào cản: tốc độ chạy test cực kỳ chậm, kết quả không ổn định (flaky tests) do phụ thuộc vào đường truyền mạng, có nguy cơ làm hỏng dữ liệu thật và rất khó để chủ động mô phỏng các tình huống lỗi ngoại lệ (edge cases).

Để giải quyết triệt để những hạn chế đó, kỹ thuật Mocking ra đời. Mocking là việc tạo ra các đối tượng giả lập (Mock objects) để thay thế và tự động mô phỏng lại hành vi của các thành phần phụ thuộc. Nhờ đó, Unit Test không cần kết nối thực tế mà vẫn nhận được kết quả trả về ngay lập tức. Điều này giúp các bài test chạy độc lập với tốc độ mili-giây, đồng thời cho phép lập trình viên chủ động tạo ra các kịch bản lỗi để kiểm chứng độ bền bỉ của phần mềm.

Tuy nhiên, nếu lạm dụng hoặc áp dụng sai Mocking, bộ test có thể đánh giá sai chất lượng của mã nguồn. Nhận thấy rõ tầm quan trọng và những thách thức đó, đề tài "Nghiên cứu và ứng dụng kỹ thuật mocking trong xây dựng kiểm thử đơn vị" được lựa chọn nhằm phân tích chuyên sâu, từ đó đề xuất quy trình ứng dụng Mocking chuẩn xác và tối ưu nhất cho các dự án thực tế.

Mục tiêu nghiên cứu

Nghiên cứu cơ sở lý thuyết về kiểm thử đơn vị (Unit Testing), các nguyên tắc kiểm thử đơn vị, vấn đề phụ thuộc (Dependencies), Test Double và vai trò của kỹ thuật Mocking trong kiểm thử đơn vị.

Nghiên cứu nguyên lý hoạt động của kỹ thuật Mocking, cơ chế hỗ trợ của Dependency Injection và khả năng ứng dụng công cụ Mockito trong xây dựng kiểm thử đơn vị.

Xây dựng và thực nghiệm các kịch bản kiểm thử đơn vị áp dụng kỹ thuật Mocking trên một ứng dụng Java, sử dụng Mockito để mô phỏng các thành phần phụ thuộc và thực thi kiểm thử.

Đánh giá hiệu quả của việc áp dụng kỹ thuật Mocking thông qua các tiêu chí như khả năng cô lập thành phần phụ thuộc, chất lượng kiểm thử, khả năng bảo trì mã kiểm thử và những hạn chế khi lạm dụng Mocking.

II. Tổng quan

Kiểm thử đơn vị là một trong những kỹ thuật kiểm thử quan trọng nhằm phát hiện sớm lỗi trong quá trình phát triển phần mềm, góp phần nâng cao chất lượng và khả năng bảo trì của hệ thống. Trong các ứng dụng hiện đại, các đơn vị chức năng thường phụ thuộc vào nhiều thành phần bên ngoài như cơ sở dữ liệu, dịch vụ web (API), hệ thống tệp hoặc các dịch vụ của bên thứ ba. Những phụ thuộc này khiến việc xây dựng và thực thi kiểm thử đơn vị gặp nhiều khó khăn, làm giảm tính độc lập và hiệu quả của quá trình kiểm thử.

Để giải quyết vấn đề trên, kỹ thuật Mocking được sử dụng nhằm mô phỏng các thành phần phụ thuộc, giúp cô lập đối tượng cần kiểm thử và tạo điều kiện kiểm thử trong môi trường có kiểm soát. Nhiều công cụ như Mockito, EasyMock và JMock đã được phát triển để hỗ trợ áp dụng kỹ thuật này, trong đó Mockito là một trong những framework được sử dụng phổ biến trong các dự án Java.

Tuy nhiên, phần lớn các tài liệu hiện nay chủ yếu giới thiệu cách sử dụng công cụ hoặc các ví dụ minh họa đơn lẻ, trong khi chưa phân tích đầy đủ nguyên lý hoạt động của kỹ thuật Mocking, phạm vi áp dụng, các trường hợp nên và không nên sử dụng, cũng như chưa đánh giá rõ hiệu quả của Mocking thông qua thực nghiệm trên các bài toán kiểm thử đơn vị.

Xuất phát từ đó, đề tài tập trung nghiên cứu kỹ thuật Mocking trong kiểm thử đơn vị, ứng dụng công cụ Mockito để xây dựng các kịch bản kiểm thử trên một ứng dụng Java và đánh giá hiệu quả của kỹ thuật này trong việc cô lập các thành phần phụ thuộc, nâng cao chất lượng kiểm thử và khả năng bảo trì mã nguồn.

III. Nội dung và phương pháp nghiên cứu

Đối tượng và phạm vi nghiên cứu

Đối tượng nghiên cứu của đề tài là kỹ thuật Mocking trong kiểm thử đơn vị (Unit Testing), bao gồm nguyên lý hoạt động, cơ chế cô lập các thành phần phụ thuộc (Dependencies), các kỹ thuật Mocking và việc ứng dụng công cụ Mockito để xây dựng và thực thi các kịch bản kiểm thử đơn vị trong môi trường Java.

Phạm vi nghiên cứu:

Nghiên cứu cơ sở lý thuyết về kiểm thử đơn vị, Test Double, kỹ thuật Mocking và Dependency Injection.

Nghiên cứu và ứng dụng Mockito để xây dựng các kịch bản kiểm thử đơn vị trên ứng dụng Java.

Thực nghiệm trên một ứng dụng Java có các thành phần phụ thuộc như Repository, Service hoặc API nhằm đánh giá hiệu quả của kỹ thuật Mocking.

Không nghiên cứu các kỹ thuật kiểm thử khác như kiểm thử hệ thống (System Testing) hoặc so sánh giữa nhiều framework Mocking khác nhau.

Nội dung nghiên cứu

Mở đầu

Chương 1: Cơ sở lý thuyết về Unit Testing và và Test Double

1.1 Tổng quan về kiểm thử Unit Testing

1.1.1 Khái niệm và vai trò của Unit Testing

1.1.2 Các nguyên tắc trong Unit Testing

1.1.3 Unit esting trong quy trình phát triển phần mềm

1.2 Vấn đề phụ thuộc (Dependencies) trong kiểm thử phần mềm

Test Double trong Unit Testing

1.3.2 Khái niệm Test Double

1.3.2 Các loại Test Double

1.3.3 Vai trò của Mocking trong Test Double

Chương 2: Nghiên cứu kỹ thuật Mocking và công cụ Mockito

2.1 Nguyên lý hoạt động của kỹ thuật Mocking

2.2 Dependency Injection hỗ trợ Mocking

2.3 Mockito Framework

2.4 Các kỹ thuật Mocking với Mockito

2.5 Nguyên tắc và lưu ý khi áp dụng kỹ thuật Mocking

2.5.1 Khi nào nên áp dụng kỹ thuật Mocking

2.5.2 Khi nào không nên áp dụng kỹ thuật Mocking

2.5.3 Những hạn chế khi lạm dụng kỹ thuật Mocking (Over-Mocking)

2.5.4 So sánh kiểm thử sử dụng Mocking và kiểm thử tích hợp (Integration Testing)

Chương 3: Triển khai thực nghiệm ứng dụng Mocking

3.1 Đối tượng thực nghiệm

3.2 Môi trường thực nghiệm

3.3 Thiết kế các kịch bản Unit Test

3.4 Xây dựng và thực thi Unit Test

3.5 Đánh giá kết quả thực nghiệm

Chương 4: Kết luận và hướng phát triển

4.1. Các kết quả đạt được

4.2. Các hạn chế

4.3. Hướng phát triển

Phương pháp nghiên cứu

Nghiên cứu tài liệu: Thu thập và phân tích các tài liệu về kiểm thử đơn vị, Test Double, kỹ thuật Mocking và framework Mockito.

Phân tích và thiết kế: Phân tích nguyên lý hoạt động của kỹ thuật Mocking và xây dựng các kịch bản kiểm thử đơn vị.

Thực nghiệm: Xây dựng môi trường kiểm thử bằng Java, JUnit 5 và Mockito để triển khai các kịch bản Unit Test.

Đánh giá: Phân tích và so sánh kết quả thực nghiệm nhằm đánh giá hiệu quả của kỹ thuật Mocking trong kiểm thử đơn vị..

IV. Dự đoán kết quả

Dự kiến sau khi quá trình nghiên cứu và thực nghiệm hoàn tất, đề tài sẽ đạt được những kết quả cụ thể trên cả hai phương diện lý thuyết và thực tiễn như sau:

Về mặt lý thuyết:

Hệ thống hóa kiến thức: Tổng hợp và làm rõ được các khái niệm cốt lõi về Unit Testing, phân biệt rõ ràng các loại Test Doubles (Dummy, Fake, Stub, Spy, Mock) và vai trò của chúng trong kiểm thử.

Xây dựng cẩm nang thực hành (Best Practices): Đưa ra được bộ quy tắc chuẩn mực khi áp dụng Mocking, giúp xác định rõ ranh giới khi nào nên dùng Mock và khi nào nên dùng Integration Test, từ đó giúp người lập trình tránh được cạm bẫy "Over-mocking" (lạm dụng Mock khiến bài test không còn phản ánh đúng logic thực tế).

Về mặt thực tiễn và ứng dụng:

Triển khai thành công trên dự án thực tế: Ứng dụng trơn tru kỹ thuật Mocking vào một dự án phần mềm cụ thể. Các phụ thuộc bên ngoài như cơ sở dữ liệu (Database) hay API của bên thứ ba sẽ được cô lập hoàn toàn.

Xây dựng bộ Test kịch bản chất lượng: Tạo ra được một bộ Test script bao phủ các logic nghiệp vụ (Business logic) phức tạp nhất, đặc biệt là khả năng giả lập các tình huống lỗi hệ thống (Edge cases) mà kiểm thử thủ công khó thực hiện được.

V. Tài liệu tham khảo

\[1] R. Osherove and V. Khorikov, The Art of Unit Testing: Third Edition, 3rd ed. Shelter Island, NY, USA: Manning Publications, 2024.

\[2] V. Khorikov, Unit Testing: Principles, Practices, and Patterns. Shelter Island, NY, USA: Manning Publications, 2020.

\[3] T. Kaczanowski, Practical Unit Testing with JUnit and Mockito. Kraków, Poland: kaczanowscy.pl, 2013.

\[4] H. Zhu, L. Wei, M. Wen, Y. Liu, S.-C. Cheung, Q. Sheng, and C. Zhou, “MockSniffer: Characterizing and Recommending Mocking Decisions for Unit Tests,” in Proceedings of the 35th IEEE/ACM International Conference on Automated Software Engineering (ASE 2020), Melbourne, Australia, 2020.

\[5] D. Tiwari, M. Monperrus, and B. Baudry, “Mimicking Production Behavior with Generated Mocks,” IEEE Transactions on Software Engineering, vol. 50, no. 11, pp. 2921–2946, 2024.

\[6] B. L. Schuchert, “Modern Mocking Tools and Black Magic,” Martin Fowler, Sep. 10, 2012. \[Online]. Available: https://martinfowler.com/articles/modernMockingTools.html

\[7] GeeksforGeeks, “How To Perform Unit Test in NestJS?,” GeeksforGeeks. \[Online]. Available: https://www.geeksforgeeks.org/

\[8] A. Singavaram, “Best Practices for Mocking in Unit Tests Using Jest,” Medium, Mar. 11, 2025. \[Online]. Available: https://medium.com/@anjisingavaram/best-practices-for-mocking-in-unit-tests-using-jest-f8072e482864

\[9] M. Kumar, “JUnit and Mockito Best Practices for Unit Testing in Java,” DEV Community, Aug. 8, 2025. \[Online]. Available: https://dev.to/iammadhankumar/junit-and-mockito-best-practices-for-unit-testing-in-java-4icb

\[10] F. Gabriel, “Best Practices for Mocking in Java Applications,” Medium, Aug. 21, 2024. \[Online]. Available: https://medium.com/@engineerfernandogabriel/best-practices-for-mocking-in-java-applications-363040213ca8

VI. Kế hoạch thực hiện đề tài

Gia Lai, ngày 15 tháng 7 năm 2026

SINH VIÊN THỰC HIỆN

(Ký và ghi rõ họ tên)

Vũ

Đặng Anh Vũ

Gia Lai, ngày 15 tháng 7 năm 2026

XÁC NHẬN CỦA KHOA	NGƯỜI HƯỚNG DẪN

(Ký và ghi rõ họ tên)

Đinh Thị Mỹ Cảnh







| STT | Nội dung thực hiện | Thời gian | Kết quả dự kiến |

| 1 | Xác định đề tài và viết đề chương | 07/2026 | Đề tài: Nghiên cứu và ứng dụng kỹ thuật Mocking trong kiểm thử đơn vị (Unit Testing) phần mềm. |

| 2 | Nghiên cứu tài liệu lý thuyết về Unit Test, Test Doubles và Mocking | 08/2026 | Tổng hợp xong cơ sở lý thuyết (Chương 1, Chương 2). |

| 3 | Lựa chọn dự án thực nghiệm, thiết lập môi trường và cấu hình công cụ Mocking | 09/2025 | Môi trường sẵn sàng để viết Test script. |

| 4 | Xây dựng Test case, áp dụng Mocking để cô lập các phụ thuộc và thực thi Test | 10/2026 | Bộ Testcase hoàn thiện cho các chức năng cần kiểm thử |

| 5 | Phân tích kết quả, so sánh, tổng hợp và viết báo cáo khóa luận | 11/2026 | Bản thảo báo cáo khóa luận hoàn chỉnh. |

| 6 | Trình duyệt, chỉnh sửa theo góp ý và bảo vệ khóa luận | 12/2026 | Hoàn thiện và bảo vệ |

