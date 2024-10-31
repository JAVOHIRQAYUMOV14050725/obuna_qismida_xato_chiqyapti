import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Course } from '../course/entities/course.entity';
import { User } from '../user/entities/user.entity';
import { User_Role } from '../enums/user.role.enum';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createEnrollmentDto: CreateEnrollmentDto, req: any): Promise<any> {
    const userId = req.user.id;
    const { courseId } = createEnrollmentDto;

    if (!courseId) {
      throw new NotFoundException('Course ID must be provided.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rolesAllowed = [User_Role.Student, User_Role.Teacher, User_Role.Admin];
    if (!rolesAllowed.includes(user.role)) {
      throw new ForbiddenException('You must be a student, teacher, or admin to enroll in a course');
    }

    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      const allCourses = await this.courseRepository.find();
      if (allCourses.length === 0) {
        throw new NotFoundException('No courses available.');
      }
      return {
        message: 'Course not found. Here are the available courses:',
        courses: allCourses.map(c => ({ id: c.id, name: c.name })),
      };
    }

    const isAlreadyEnrolled = await this.enrollmentRepository.findOne({
      where: { student: { id: userId }, course: { id: courseId } },
    });
    if (isAlreadyEnrolled) {
      return { message: 'You are already enrolled in this course', data: isAlreadyEnrolled };
    }

    const enrollment = this.enrollmentRepository.create({
      student: user,
      course,
      enrolledAt: new Date(),
    });

    try {
      const savedEnrollment = await this.enrollmentRepository.save(enrollment);
      return {
        message: 'Enrollment successfully created',
        data: {
          id: savedEnrollment.id,
          course: savedEnrollment.course,
          enrolledAt: savedEnrollment.enrolledAt,
        },
      };
    } catch (error) {
      console.error('Error saving enrollment:', error); // Xatoni konsolga chiqarish
      throw new ConflictException('Failed to create enrollment, please try again');
    }
  }


  async findAll(req: any): Promise<any> {
    const userId = req.user.id;
    const user = await this.userRepository.findOne(userId);

    if (user.role === User_Role.Admin || user.role === User_Role.Teacher) {
      const enrollments = await this.enrollmentRepository.find({ relations: ['student', 'course'] });
      return enrollments.map(enrollment => {
        const { password, refreshToken, ...studentWithoutSensitiveData } = enrollment.student;
        return {
          ...enrollment,
          student: studentWithoutSensitiveData,
        };
      });
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: userId } },
      relations: ['course'],
    });
    return enrollments.map(enrollment => ({
      ...enrollment,
      student: { id: userId },
    }));
  }

  async remove(courseId: number, req: any): Promise<any> {
    const userId = req.user.id;
    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: userId } },
      relations: ['course'],
    });

    if (enrollments.length === 0) {
      throw new NotFoundException('You are not enrolled in any courses.');
    }

    const enrollment = enrollments.find(enrollment => enrollment.course.id === courseId);
    if (!enrollment) {
      return {
        message: 'Enrollment not found for the provided course ID. Here are your enrolled courses:',
        courses: enrollments.map(e => ({ id: e.course.id, name: e.course.name })),
      };
    }

    await this.enrollmentRepository.remove(enrollment);
    return {
      message: 'Enrollment successfully removed.',
      removedCourse: {
        id: enrollment.course.id,
        name: enrollment.course.name,
      },
    };
  }
}
