import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthChangePasswordRequestDto,
  AuthProfileResponseDto,
  AuthRefreshRequestDto,
  LoginAuthRequestDto,
  LoginAuthResponseDto,
  RegisterAuthRequestDto,
  RegisterAuthResponseDto,
  UpdateAuthProfileRequestDto,
} from './auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuthException } from './auth.exception';
import AuthValidation from './auth.validation';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Branch } from 'src/branch/branch.entity';
import { BranchValidation } from 'src/branch/branch.validation';
import { BranchException } from 'src/branch/branch.exception';
import { UserRequest } from './user.decorator';
import { FileService } from 'src/file/file.service';

@Injectable()
export class AuthService {
  private saltOfRounds: number;
  private duration: number;
  private refeshableDuration: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectMapper()
    private readonly mapper: Mapper,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly fileService: FileService,
  ) {
    this.saltOfRounds = this.configService.get<number>('SALT_ROUNDS');
    this.duration = this.configService.get<number>('DURATION');
    this.refeshableDuration = this.configService.get<number>(
      'REFRESHABLE_DURATION',
    );
  }

  async uploadAvatar(user: UserRequest, file: Express.Multer.File) {
    const context = `${AuthService.name}.${this.uploadAvatar.name}`;
    const userEntity = await this.userRepository.findOne({
      where: { id: user.userId },
    });

    // Delete old avatar
    await this.fileService.removeFile(userEntity.image);

    // Save new avatar
    const uploadedFile = await this.fileService.uploadFile(file);
    userEntity.image = uploadedFile.name;
    await this.userRepository.save(userEntity);
    this.logger.log(`User ${user.userId} uploaded avatar`, context);

    return this.mapper.map(userEntity, User, AuthProfileResponseDto);
  }

  async changePassword(
    user: UserRequest,
    requestData: AuthChangePasswordRequestDto,
  ) {
    const context = `${AuthService.name}.${this.changePassword.name}`;
    const userEntity = await this.userRepository.findOne({
      where: { id: user.userId },
    });
    if (!userEntity) {
      this.logger.warn(`User ${user.userId} not found`, context);
      throw new AuthException(AuthValidation.USER_NOT_FOUND);
    }

    // Validate same old password
    const isMatch = await bcrypt.compare(
      requestData.oldPassword,
      userEntity.password,
    );
    if (!isMatch) {
      this.logger.warn(
        `User ${user.userId} provided invalid old password`,
        context,
      );
      throw new AuthException(AuthValidation.INVALID_OLD_PASSWORD);
    }

    const hashedPass = await bcrypt.hash(
      requestData.newPassword,
      this.saltOfRounds,
    );
    userEntity.password = hashedPass;
    await this.userRepository.save(userEntity);
    this.logger.log(`User ${user.userId} changed password`, context);

    return this.mapper.map(userEntity, User, AuthProfileResponseDto);
  }

  /**
   * Update user profile
   * @param {UserRequest} UserRequest
   * @param {UpdateAuthProfileRequestDto} requestData
   * @returns {Promise<AuthProfileResponseDto>} Updated user profile
   * @throws {BranchException} Branch not found
   * @throws {AuthException} User not found
   */
  async updateProfile(
    UserRequest: UserRequest,
    requestData: UpdateAuthProfileRequestDto,
  ): Promise<AuthProfileResponseDto> {
    const context = `${AuthService.name}.${this.updateProfile.name}`;
    // Validation branch
    const branch = await this.branchRepository.findOne({
      where: { slug: requestData.branchSlug },
    });
    if (!branch) {
      this.logger.warn(`Branch ${requestData.branchSlug} not found`, context);
      throw new BranchException(BranchValidation.BRANCH_NOT_FOUND);
    }

    const user = await this.userRepository.findOne({
      where: { id: UserRequest.userId },
    });
    if (!user) {
      this.logger.warn(`User ${user.id} not found`, context);
      throw new AuthException(AuthValidation.USER_NOT_FOUND);
    }

    Object.assign(user, {
      ...requestData,
      branch,
    });
    const updatedUser = await this.userRepository.save(user);
    this.logger.log(`User ${user.id} updated profile`, context);

    return this.mapper.map(updatedUser, User, AuthProfileResponseDto);
  }

  /**
   *
   * @param {string} phonenumber
   * @param {string} pass
   * @returns {Promise<User|null>} User if found, null otherwise
   */
  async validateUser(phonenumber: string, pass: string): Promise<User | null> {
    const context = `${AuthService.name}.${this.validateUser.name}`;
    const user = await this.userRepository.findOne({ where: { phonenumber } });
    if (!user) {
      this.logger.warn(`User ${phonenumber} not found`, `${context}`);
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      this.logger.warn(
        `User ${phonenumber} provided invalid password`,
        context,
      );
      return null;
    }
    return user;
  }

  private async generateToken(payload: any): Promise<LoginAuthResponseDto> {
    return {
      accessToken: this.jwtService.sign(payload),
      expireTime: moment().add(this.duration, 'seconds').toString(),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.refeshableDuration,
      }),
      expireTimeRefreshToken: moment()
        .add(this.refeshableDuration, 'seconds')
        .toString(),
    };
  }

  /**
   *
   * @param {LoginAuthRequestDto} loginAuthDto
   * @returns {Promise<LoginAuthResponseDto>} Access token
   * @throws {UnauthorizedException} Invalid credentials
   */
  async login(
    loginAuthDto: LoginAuthRequestDto,
  ): Promise<LoginAuthResponseDto> {
    const user = await this.validateUser(
      loginAuthDto.phonenumber,
      loginAuthDto.password,
    );
    if (!user) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, jti: uuidv4(), scope: '[]' };
    this.logger.log(
      `User ${user.phonenumber} logged in`,
      `${AuthService.name}.${this.login.name}`,
    );
    return this.generateToken(payload);
  }

  /**
   *
   * @param {RegisterAuthRequestDto} requestData
   * @returns {Promise<RegisterAuthResponseDto>} User registered successfully
   * @throws {AuthException} User already exists
   */
  async register(
    requestData: RegisterAuthRequestDto,
  ): Promise<RegisterAuthResponseDto> {
    const context = `${AuthService.name}.${this.register.name}`;
    console.log({ requestData });
    // Validation
    const branch = await this.branchRepository.findOne({
      where: {
        slug: requestData.branchSlug,
      },
    });
    if (!branch) {
      this.logger.warn(`Branch ${requestData.branchSlug} not found`, context);
      // throw new BranchException(BranchValidation.BRANCH_NOT_FOUND);
    }

    const userExists = await this.userRepository.findOne({
      where: {
        phonenumber: requestData.phonenumber,
      },
    });
    if (userExists) {
      this.logger.warn(
        `User ${requestData.phonenumber} already exists`,
        context,
      );
      throw new AuthException(AuthValidation.USER_EXISTS);
    }

    const user = this.mapper.map(requestData, RegisterAuthRequestDto, User);

    this.logger.warn(`Salt of rounds: ${this.saltOfRounds}`, context);
    const hashedPass = await bcrypt.hash(
      requestData.password,
      this.saltOfRounds,
    );

    Object.assign(user, { branch, password: hashedPass });
    this.userRepository.create(user);
    const createdUser = await this.userRepository.save(user);
    this.logger.warn(`User ${requestData.phonenumber} registered`, context);
    return this.mapper.map(createdUser, User, RegisterAuthResponseDto);
  }

  /**
   *
   * @param {string} userId
   * @returns {Promise<AuthProfileResponseDto>} User profile
   * @throws {AuthException} User not found
   */
  async getProfile({
    userId,
  }: {
    userId: string;
  }): Promise<AuthProfileResponseDto> {
    const context = `${AuthService.name}.${this.getProfile.name}`;
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['branch'],
    });
    if (!user) {
      this.logger.error(`User ${userId} not found`, context);
      throw new AuthException(AuthValidation.USER_NOT_FOUND);
    }
    return this.mapper.map(user, User, AuthProfileResponseDto);
  }

  async refresh(
    requestData: AuthRefreshRequestDto,
  ): Promise<LoginAuthResponseDto> {
    const context = `${AuthService.name}.${this.refresh.name}`;
    // TODO: Validate access token
    let isExpiredAccessToken = false;
    try {
      this.jwtService.verify(requestData.accessToken);
    } catch (error) {
      isExpiredAccessToken = true;
    }
    if (!isExpiredAccessToken) {
      this.logger.warn(`Access token is not expired`, context);
      throw new UnauthorizedException();
    }

    // TODO: Validate refresh token
    let isExpiredRefreshToken = false;
    try {
      this.jwtService.verify(requestData.refreshToken);
    } catch (error) {
      isExpiredRefreshToken = true;
    }
    if (isExpiredRefreshToken) {
      this.logger.warn(`Refresh token is expired`, context);
      throw new UnauthorizedException();
    }

    // TODO: Generate new access token
    const payload = this.jwtService.decode(requestData.refreshToken);
    this.logger.log(`User ${payload.sub} refreshed token`, context);

    return this.generateToken(payload);
  }
}
