import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from '../user-managment/services/user.service';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css'],
})
export class PopupComponent implements OnInit {
  error!: string;
  closeDialog() {
    this.userService.deleteUser(<string>this.data.id).subscribe({
      complete: () => {
        this.dialogRef.close();
      },
      error: (err) => {
        this.error = err;
      },
    });
  }
  constructor(
    private userService: UserService,
    public dialogRef: MatDialogRef<PopupComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { userEmail?: string; id?: string; message: {success?:string,error?:string} }
  ) {}

  ngOnInit(): void {
    if(this.data.message){
      setTimeout(()=>{
        this.dialogRef.close()
      },2000)
    }
    
  }
}
