import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, map, switchMap } from 'rxjs';
import { UserService, UserEntities, Roles } from './services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupComponent } from '../popup/popup.component';
import { MatSelect } from '@angular/material/select';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'app-user-managment',
  templateUrl: './user-managment.component.html',
  styleUrls: ['./user-managment.component.css'],
})
export class UserManagmentComponent implements OnInit {
  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}
  //----------> Initial declarations
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('rolesSelection') rolesSelection!: MatSelect;
  @ViewChild(MatSort) matSort!: MatSort;
  @ViewChild('drawer') drawer!: MatDrawer;

  editing = false; // used for controlling if add or editing functions should be invoked

  roles!: Roles[];

  // properties of mat table
  dataSource: MatTableDataSource<UserEntities> = new MatTableDataSource();
  displayedColumns = [
    'Picture',
    'Email',
    'First Name',
    'Last Name',
    'Roles',
    'Status',
    'Delete',
  ];

  //control for search input
  searchControl = new FormControl('');

  drawerForm = this.fb.group({
    id: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    locked: ['', Validators.required],
    roles: [[''], [Validators.required]],
  });
  // declarations End <---------

  //used for loading data source
  loadDataSource() {
    this.userService
      .getUsers(
        '',
        // preserving sort order whenever calling the function
        this.matSort.direction === '' ? 'email' : this.matSort.active,
        this.matSort.direction
      )
      .subscribe((data) => (this.dataSource.data = <UserEntities[]>data));
  }

  //Main content intercations --------------> Start

  //opening popup componenet whenever needed
  openDialog(
    email?: string,
    id?: string,
    message?: {
      success?: string;
      error?: string;
    }
  ) {
    return this.dialog.open(PopupComponent, {
      data: { userEmail: email, id: id, message: message },

      autoFocus: 'first-header',
    });
  }
  // Open the popup after user clicks the delete button
  onDeleteDialog(email: string, id: string) {
    let dialogRef = this.openDialog(email, id, undefined);

    dialogRef.afterClosed().subscribe(() => this.loadDataSource());
  }

  // used for matSortChane event
  sort() {
    this.userService
      .getUsers(
        <string>this.searchControl?.value,
        //checking if sort direction has been set by user. If not, default  sort paramameter is Email
        this.matSort.direction === '' ? 'email' : this.matSort.active,
        this.matSort.direction
      )
      .subscribe((data) => {
        this.dataSource.data = <UserEntities[]>data;
      });
  }

  // invoking whenever the email cell is clicked
  edit(element: UserEntities) {
    this.drawerForm.get('email')?.clearAsyncValidators(); // removing all async validators since there is no need to check anything on the server side
    this.drawerForm.markAllAsTouched(); // mark all controls as Touched to control if some of the properties are missing

    this.editing = true;
    this.drawerForm.patchValue({
      id: element.id,
      firstName: element.firstName,
      lastName: element.lastName,
      email: element.email,
      locked: element.locked ? 'Inactive' : 'Active',
      roles: element.roles,
    });
  }

  //invoked if the save button is hit on the sidenav
  saveEdit() {
    this.userService
      .updateUser(
        <UserEntities>(<unknown>this.drawerForm?.value),
        // controlling if the user should be marked as active or not, since value of theformcontrol type of string.
        this.drawerForm.get('locked')?.value === 'Inactive' ? true : false
      )
      .subscribe({
        next: () => this.loadDataSource(),
        complete: () => {
          this.openDialog(undefined, undefined, {
            success: 'Successfully Saved',
          });
        },
        error: () => {
          this.openDialog(undefined, undefined, {
            error: 'Sorry, something went wrong',
          });
        },
      });

    //resetting the form
    this.drawerForm.reset();
    this.drawer.close();
  }
  openAddForm() {
    this.drawerForm.reset();
    this.drawer.open();
    this.drawerForm
      ?.get('email')
      ?.setAsyncValidators(this.userService.userAsyncValdidator());
    // used for checking if the user already exists or not, only used if the user is adding a new user
  }
  //adding the user
  addUser() {
    this.userService
      .addUser(
        <UserEntities>(<unknown>this.drawerForm?.value),
        this.drawerForm.get('locked')?.value === 'Inactive' ? true : false
        // controlling if the user should be marked as active or not, since value of theformcontrol type of string.
      )
      .subscribe({
        next: () => this.loadDataSource(),
        complete: () => {
          this.openDialog(undefined, undefined, {
            success: 'Successfully Saved',
          });
        },
        error: () => {
          this.openDialog(undefined, undefined, {
            error: 'Sorry, something went wrong',
          });
        },
      });

    this.drawerForm.reset();
    this.drawer.close();
  }
  // removing a selected role from the role select html element
  removeRoleSelection(role: string) {
    this.rolesSelection.options.forEach((item) => {
      if (item.value === role) {
        item.deselect();
      }
    });
  }

  //Main content intercations --------------------> END

  ngOnInit(): void {
    // binded to search input value changing event
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        switchMap((query) =>
          this.userService.getUsers(
            <string>query,
            // to get users sorted by email if no sort header is selected
            this.matSort.direction === '' ? 'email' : this.matSort.active,
            this.matSort.direction
          )
        )
      )
      .subscribe((data) => {
        this.dataSource.data = <UserEntities[]>data;
      });

    //loading roles from the server
    this.userService.getReferenceData().subscribe((data) => {
      this.roles = <Roles[]>data;
    });
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator; // setting the datasource paginator
    this.loadDataSource(); // initially loading data source
  }
}
