import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HotToastService } from '@ngneat/hot-toast';
import { map, Observable } from 'rxjs';
import { Diario } from 'src/app/core/models/diario';
import { DiariosService } from 'src/app/core/services/diarios/diarios.service';
import { DiarioAddComponent } from '../diario-add/diario-add.component';
import { DiarioEditComponent } from '../diario-edit/diario-edit.component';
import { DiarioDetailComponent } from '../diario-detail/diario-detail.component';

@Component({
  selector: 'app-diario-list',
  templateUrl: './diario-list.component.html',
  styleUrls: ['./diario-list.component.scss'],
})
export class DiarioListComponent implements OnInit {
  allDiarios$?: Observable<Diario[]>;
  meusDiarios$?: Observable<Diario[]>;

  pagina: number = 1;
  collection: any[] = [];

  constructor(
    private dialog: MatDialog,
    private diariosService: DiariosService,
    private toast: HotToastService,
    private breakpointObserver: BreakpointObserver
  ) {}


  qtColumns = this.breakpointObserver
  .observe(Breakpoints.Handset)
  .pipe(
    map(({ matches }) => {
      if (matches) {
        return {cols: 3, row: 1}
      }

      return {cols: 1, row: 1}


    })
  )

  onClickAdd() {
    const ref = this.dialog.open(DiarioAddComponent, { maxWidth: '512px' });

    ref.afterClosed().subscribe({
      next: (result) => {
        if (result) {
          this.diariosService
            .addDiario(result.diario, result.imagem)
            .pipe(
              this.toast.observe({
                loading: 'Adicionando...',
                error: 'Ocorreu um erro',
                success: 'Diário adicionado',
              })
            )
            .subscribe();
        }
      },
    });
  }

  onClickEdit(diario: Diario) {
    const ref = this.dialog.open(DiarioEditComponent, {
      maxWidth: '512px',
      data: { ...diario },
    });
    ref.afterClosed().subscribe({
      next: (result) => {
        if (result) {
          this.diariosService
            .editDiario(result.diario, result.imagem)
            .pipe(
              this.toast.observe({
                loading: 'Atualizando...',
                error: 'Ocorreu um erro',
                success: 'Diário atualizado',
              })
            )
            .subscribe();
        }
      },
    });
  }

  showPhotoDetail(diario: Diario){
    this.dialog.open(DiarioDetailComponent, {
      panelClass: "fullscreen-dialog",
      maxWidth: "100%",
      minWidth: "100%",
      data: {...diario}
    })
  }

  onClickDelete(diario: Diario) {
    const canDelete = confirm('Deseja mesmo deletar?');
    if (canDelete) {
      this.diariosService
        .deleteDiario(diario)
        .pipe(this.toast.observe({ success: 'Diário apagado!' }))
        .subscribe();
    }
  }

  ngOnInit(): void {
    this.allDiarios$ = this.diariosService.getTodosDiarios();
    this.meusDiarios$ = this.diariosService.getDiariosUsuario();

  }
}
