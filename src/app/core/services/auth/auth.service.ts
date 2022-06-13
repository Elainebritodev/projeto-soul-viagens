import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth, authState, FacebookAuthProvider, updateProfile } from '@angular/fire/auth';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
} from '@firebase/auth';
import { collection, setDoc, updateDoc } from '@firebase/firestore';
import { first, forkJoin, from, map, Observable, pluck, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private auth: Auth, 
    private db: Firestore, 
    private router: Router,
    private http: HttpClient
  ) {}

  uid?: string;

  getStreamToken(){
    return authState(this.auth).pipe( 
      first(), 
      switchMap((user: any) => this.http.post<{token: string}>("http://localhost:5001/app-diario-viagens/us-central1/createStreamToken", {
      user: user.uid
    }).pipe(pluck("token"))))
  }

  get logged() {
    return authState(this.auth).pipe(
      tap((user) => {
        this.uid = user?.uid;
      })
    );
  }

  get userData() {
    const userDoc = doc(this.usuarios, this.uid);
    return docData(userDoc).pipe(first());
  }

  get isAdmin() {
    return authState(this.auth).pipe( 
      first(), 
      switchMap((user: any) => { 
        const userDoc = doc(this.usuarios, user?.uid);
        return docData(userDoc).pipe(first()); 
      }),
      map((user) => user['isAdmin'] === true) 
    );
  }

  usuarios = collection(this.db, 'usuarios'); 

  signupEmail(email: string, password: string, nome: string, nick: string) {
  
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      tap((creds) => {
        const user = creds.user;
        const userDoc = doc(this.usuarios, user.uid); 
        setDoc(userDoc, {
          uid: user.uid,
          email: email,
          nome: nome,
          nick: nick,
        });
        this.emailVerificacao(creds.user);
        this.http.post("http://localhost:5001/app-diario-viagens/us-central1/createStreamUser", {user: {...user, displayName: nome}}).subscribe(); 
      }),

    );
  }

  loginEmail(email: string, password: string) {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      tap((creds) => {
        this.emailVerificacao(creds.user);
      })
    );
  }

  logout(rota: '/login' | '/confirmar-email') {
    return from(this.auth.signOut()).pipe(
      tap(() => {
        this.router.navigate([rota]); 
      })
    );
  }

  emailVerificacao(user: any) {
    if (!user.emailVerified) {
      sendEmailVerification(user);
      this.logout('/confirmar-email').subscribe();
    } else {
      this.router.navigate(['/']);
    }
  }

  loginGoogle() {
    return from(signInWithPopup(this.auth, new GoogleAuthProvider())).pipe(
      tap((creds) => {
        const user = creds.user;
        const userDoc = doc(this.usuarios, user.uid);       
        setDoc(userDoc, {
          uid: user.uid,
          email: user.email,
          nome: user.displayName, 
          nick: 'Um usuário do Google',
        });
        this.router.navigate(['/']);
      })
    );
  }

  loginFacebook() {
    return from(signInWithPopup(this.auth, new FacebookAuthProvider())).pipe(
      tap((creds) => {
        const user = creds.user;
        const userDoc = doc(this.usuarios, user.uid);
        setDoc(userDoc, {
          uid: user.uid,
          email: user.email,
          nome: user.displayName,
          imagem: user.photoURL,
          nick: 'Um usuário do Facebook',
        });

        this.router.navigate(['/']);
      })
    );
  }


  recoverPassword(email: string) {
    return from(sendPasswordResetEmail(this.auth, email));
  }
}
