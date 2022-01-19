import http from "@/app/services/http";
import { LoginRequestDto } from "@/app/common/dtos/LoginRequestDto";

import { RegisterUserDTO } from "@/app/common/dtos/RegisterUserDTO";

import { AxiosResponse } from "axios";
import { LoggedInUserDto } from "@/app/common/dtos/LoggedInUserDto";
import { UserRegistrationResponse } from "../common/dtos/UserRegistrationResponse";
import { ActivateUserDTO } from "../common/dtos/ActivateUserDTO";

export default {
  login: (request: LoginRequestDto): Promise<AxiosResponse<void>> => {
    return http.post("/v1/users/custom-signin", request);
  },

  register: (request: RegisterUserDTO): Promise<AxiosResponse<UserRegistrationResponse>> => {
    return http.post("/v1/users/redirect", request);
  },

  activateUser: (request: ActivateUserDTO): Promise<AxiosResponse<any>> => {
    return http.post("/v1/users/activate-user", request);
  },
  logout: (): Promise<AxiosResponse<void>> => {
    return http.post("/v1/users/logout");
  },
  whoAmI: (): Promise<AxiosResponse<LoggedInUserDto>> => {
    return http.get("/v1/users/whoami");
  },
};
