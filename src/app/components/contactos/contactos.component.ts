import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDialogService } from '../../services/modal-dialog.service';

//import { jsPDF } from "jspdf"; //ref angular reporte pdf  : https://www.positronx.io/angular-pdf-tutorial-export-pdf-in-angular-with-jspdf/
import { HttpClient } from '@angular/common/http';
import {
  analyzeAndValidateNgModules,
  Identifiers,
  ThisReceiver,
} from '@angular/compiler';
//import { UtilesService } from "src/app/services/utiles.service";
import { noop, Observable, Observer, of, Subscription } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UtilesService } from '../../services/utiles.service';
import { ContactoService } from '../../services/contactos.service';

@Component({
  selector: 'app-contactos',
  templateUrl: './contactos.component.html',
  styleUrls: ['./contactos.component.css'],
})
export class ContactosComponent implements OnInit, OnDestroy {
  Titulo = 'Contactos';
  TituloAccionABMC = {
    A: '(Agregar)',
    B: '(Eliminar)',
    M: '(Modificar)',
    C: '(Consultar)',
    L: '(Listado)',
  };
  AccionABMC = 'L'; // inicialmente inicia en el listado de Clientes (buscar con parametros)
  Mensajes = {
    SD: ' No se encontraron registros...',
    RD: ' Revisar los datos ingresados...',
  };

  Items = null;
  RegistrosTotal: number;
  Pagina = 1; // inicia pagina 1

  FormBusqueda: FormGroup;
  FormRegistro: FormGroup;
  submitted = false;
  buscando = false;

  //@ViewChild('htmlData') htmlData: ElementRef;
  Nombre: any;
  FechaNacimiento: any;
  Telefono: any;
  ContactoService: any;
  Subscripciones: Subscription[] = [];

  constructor(
    public formBuilder: FormBuilder,
    private http: HttpClient,
    private modalDialogService: ModalDialogService,
    private utiles: UtilesService
  ) {}

  ngOnInit() {
    this.FormBusqueda = this.formBuilder.group({
      Nombre: [''],
      Activo: [null],
    });
    this.FormRegistro = this.formBuilder.group({
      Nombre: [
        null,
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(50),
        ],
      ],
      FechaNacimiento: [null, [Validators.required]],
      Telefono: [null, [Validators.required, Validators.pattern('[0-9]{9}')]],
    });
  }

  ngOnDestroy() {
    this.Subscripciones.forEach((element) => {
      element.unsubscribe();
    });
  }

  //-----------------------------------
  Agregar() {
    this.AccionABMC = 'A';
    this.FormRegistro.reset({ Activo: true, IdContacto: 0 });
    this.submitted = false;
  }

  //Buscar segun los filtros, establecidos en FormRegistro
  Buscar() {
    let params = { ...this.FormBusqueda.value, Pagina: this.Pagina };
    // let params: any = {};
    // params.Nombre = this.FormBusqueda.value.Nombre;
    // params.Activo = this.FormBusqueda.value.Activo;
    // params.Pagina = this.Pagina;

    this.buscando = true;
    this.http
      .get(environment.ConexionWebApiProxy + 'contactos/', { params: params })
      .subscribe((res: any) => {
        this.Items = res;
        this.RegistrosTotal = this.Items.length;
        setTimeout(() => (this.buscando = false), 2000);
      });
  }
  
  // Obtengo un registro especifico según el Id
  BuscarPorId(Item, AccionABMC) {
    window.scroll(0, 0); // ir al incio del scroll
    this.http
      .get(environment.ConexionWebApiProxy +  "contactos/"  + Item.IdContacto)
      .subscribe((res: any) => {
        let aux = {res};
      
        //formatear fecha de  ISO 8061 a string dd/MM/yyyy
        // aux.FechaIngreso = this.utiles.Fecha_ISO_ddMMyyyy(res.FechaIngreso);
        // aux.FechaEgreso = this.utiles.Fecha_ISO_ddMMyyyy(res.FechaEgreso);
        //aux.FechaNacimiento = this.utiles.Fecha_ISO_ddMMyyyy(
        //res.FechaNacimiento
        //);


        //this.FormRegistro.patchValue(aux, { emitEvent: false });  // para que no desdecadene lo ngchanges del provincia por ej que borraria departamento
        //this.FormRegistro.patchValue(aux); //que se desencadene el ngchanges para cargar las provincias segun el pais
        this.AccionABMC = AccionABMC;
      });
  }



  Consultar(Item) {
    this.BuscarPorId(Item, 'C');
  }

  // comienza la modificacion, luego la confirma con el metodo Grabar
  Modificar(Item) {
    this.submitted = false;
    this.FormRegistro.markAsUntouched();
    this.BuscarPorId(Item, 'M');
  }

  // grabar tanto altas como modificaciones
  Grabar() {
    this.submitted = true;
    // verificar que los validadores esten OK
    if (this.FormRegistro.invalid) {
      return;
    }

    //hacemos una copia de los datos del formulario, para modificar la fecha y luego enviarlo al servidor
    const itemCopy = { ...this.FormRegistro.value };

    // //convertir fecha de string dd/MM/yyyy a ISO para que la entienda webapi
    // itemCopy.FechaIngreso = this.utiles.Fecha_ddMMyyyy_ISO(
    //   itemCopy.FechaIngreso
    // );
    // itemCopy.FechaEgreso = this.utiles.Fecha_ddMMyyyy_ISO(itemCopy.FechaEgreso);
    // itemCopy.FechaNacimiento = this.utiles.Fecha_ddMMyyyy_ISO(
    //   itemCopy.FechaNacimiento
    // );

    // agregar post
    if (this.AccionABMC == 'A') {
      this.http
        .post(
          environment.ConexionWebApiProxy + 'contactos',
          this.FormRegistro.value
        )
        .subscribe((res: any) => {
          this.Volver();
          this.modalDialogService.Alert('Registro agregado correctamente.');
          this.Buscar();
        });
    } else {
      // modificar put
      this.http
        .put(
          environment.ConexionWebApiProxy +
            'contactos' +
            this.FormRegistro.value.IdContacto,
          this.FormRegistro.value
        )
        .subscribe((res: any) => {
          this.Volver();
          this.modalDialogService.Alert('Registro modificado correctamente.');
          this.Buscar();
        });
    }
  }

  // representa la baja logica
  ActivarDesactivar(Item) {
    this.modalDialogService.Confirm(
      'Esta seguro de que quiere eliminar este registro?',
      undefined,
      undefined,
      undefined,
      () =>
        this.http
          .delete(
            environment.ConexionWebApiProxy + 'contactos/' + Item.IdContacto
          )
          .subscribe((res: any) => this.Buscar()),
      null
    );
  }

  // Volver desde Agregar/Modificar
  Volver() {
    this.AccionABMC = 'L';
  }

  ImprimirListado() {
    this.modalDialogService.Alert('Sin desarrollar...');

    // ref angular pdf : https://stackoverflow.com/a/63684298
    // let DATA = this.htmlData.nativeElement;
    // let doc = new jsPDF('p', 'pt', 'a4');
    // doc.html(DATA, {
    //   callback: (doc) => {
    //     doc.output("dataurlnewwindow");
    //   }
    // });
  }

  cssValid(field: string) {
    if (this.FormRegistro.get(field).valid) return 'is-valid';
    if (
      this.FormRegistro.get(field).invalid &&
      (this.FormRegistro.get(field).touched || this.submitted)
    )
      return 'is-invalid';
  }

  public getError(controlName: string): string {
    let error = '';
    const control = this.FormRegistro.get(controlName);
    if (control.touched && control.errors != null) {
      if (control.errors?.required) error = 'Datos requerido';
      else if (control.errors?.minlength)
        error =
          'Dato con minimo de ' +
          control.errors.minlength.requiredLength +
          ' caracteres';
      else if (control.errors?.maxlength)
        error =
          'Dato con maximo de ' +
          control.errors.maxlength.requiredLength +
          ' caracteres';

      error = error + ' ' + JSON.stringify(control.errors);
    }
    return error;
  }
}
