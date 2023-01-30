import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  dbUrl = 'https://development.api.optio.ai/api/v2/admin/users';
  referenceUrl = 'https://development.api.optio.ai/api/v2/reference-data/find';
  auth_token =
    'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImludGVybnNoaXBAb3B0aW8uYWkiLCJzdWIiOiIzOTg3NjY3MzE3MzQ4OTgzIiwiaWF0IjoxNjczNTI3NzMyLCJleHAiOjE2NzUyNTU3MzJ9.ss2VWdlLDTJYa2rOXfffwnaMJIIeEB7DwkSVsl8xcTjheFu8ATS4eoCtzP5lDYRxQSaG7JXi8FhCRFivMSkSgg';

  header = new HttpHeaders()
    .set('Authorization', `Bearer ${this.auth_token}`)
    .set('Content-Type', 'application/json');
  getUsers(
    search: string = '',
    sort: string = 'email',
    sortDir: string = 'asc'
  ) {
    return this.http
      .post<Users>(
        `${this.dbUrl}/find`,
        {
          search: `${search}`,
          sortBy: `${sort}`,
          sortDirection: `${sortDir}`,
          pageIndex: 0,
          pageSize: 499,
          includes: [
            'id',
            'avatarId',
            'email',
            'firstName',
            'lastName',
            'roles',
            'locked',
          ],
          excludes: [],
        },
        { headers: this.header }
      )
      .pipe(map((data) => data.data.entities));
  }
  getReferenceData() {
    return this.http
      .post<RolesData>(
        `${this.referenceUrl}`,
        {
          typeId: 4,
          sortBy: 'name',
          sortDirection: 'asc',
          pageIndex: 0,
          pageSize: 50,
          includes: ['code', 'name'],
        },
        { headers: this.header }
      )
      .pipe(map((item) => item.data.entities));
  }
  updateUser(user: UserEntities, locked: boolean) {
    user.locked = locked;
    return this.http.post(`${this.dbUrl}/save`, user, { headers: this.header });
  }
  deleteUser(id: string) {
    return this.http.post(
      `${this.dbUrl}/remove`,
      { id: id },
      { headers: this.header }
    );
  }
  addUser(user: UserEntities, locked: boolean) {
    user.locked = locked;
    return this.http.post(`${this.dbUrl}/save`, user, { headers: this.header });
  }
  getOneUser(id: string) {
    return this.http.post<Users>(
      `${this.dbUrl}/find-one`,
      { id: id },
      { headers: this.header }
    );
  }
  userAsyncValdidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.getUsers(control.value).pipe(
        map((data) => (JSON.stringify(data) === '[]' ? null : { exists: true }))
      );
    };
  }
  constructor(private http: HttpClient) {}
}
export interface Users {
  data: UsersData;
  success: boolean;
}
export interface UsersData {
  entities: UserEntities[] | Roles[];
  total: number;
}
export interface UserEntities {
  id: string;
  avatarId?: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Array<string>;
  locked: boolean;
}

export interface RolesData {
  data: UsersData;
  success: boolean;
}
export interface Roles {
  code: string;
  name: string;
}
