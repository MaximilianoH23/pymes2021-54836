import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Contacto } from '../models/contacto';

@Injectable({
  providedIn: 'root',
})
export class ContactoService {
  resourceUrl: string;
  constructor(private httpClient: HttpClient) {
    this.resourceUrl = environment.ConexionWebApiProxy + 'contactos/';
    //this.resourceUrl = 'https://localhost:44349/api/Articulos/';
  }

  get(Nombre: string, Pagina: number) {
    let params = new HttpParams();
    if (Nombre != null) {
      params = params.append('Nombre', Nombre);
    }
    params = params.append('Pagina', Pagina.toString());

    return this.httpClient.get(this.resourceUrl, { params: params });
  }

  getById(Id: number) {
    return this.httpClient.get(this.resourceUrl + Id);
  }

  post(obj: Contacto) {
    return this.httpClient.post(this.resourceUrl, obj);
  }

  put(IdContacto: number, obj: Contacto) {
    return this.httpClient.put(this.resourceUrl + Id, obj);
  }

  delete(IdContacto) {
    return this.httpClient.delete(this.resourceUrl + IdContacto);
  }
}