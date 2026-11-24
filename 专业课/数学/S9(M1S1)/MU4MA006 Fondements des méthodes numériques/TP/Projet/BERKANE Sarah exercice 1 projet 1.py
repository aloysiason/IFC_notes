# -*- coding: utf-8 -*-
"""
Created on Mon Dec 25 14:31:46 2023

@author: Sarah Keita
"""

import numpy as np
import matplotlib.pyplot as plt 
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve

# definir les variables donnees : 
nu = 0.01
gamma = 10

#definir la donnee initiale : 
def uini(x):
    return 0.25*np.sin(np.pi*x)*np.exp(-20*(x-0.5)**2)

#definir le code qui renvoie les matrices A et B

def matrices(Nx,Nt,U):
    """ en entree nb de points de la discretisation en espace
        et en temps et le vecteur U"""
    
# pas d'espace uniforme
    h = 1/(Nx+1)
    F = np.zeros(Nx)
    T = 1 # Temps final
    delta_t = T/Nt
    
#construction de la matrice A
    A = np.zeros((Nx,Nx)) 
    
    for i in range(Nx-1):
        A[i,i]= 1 + (2*delta_t*nu)/h**2 - (delta_t*gamma)
        A[i+1,i]= -(delta_t*nu)/h**2
        A[i,i+1]= -(delta_t*nu)/h**2
    A[Nx-1,Nx-1]= 1 + (2*delta_t*nu)/h**2 - (delta_t*gamma)

#construction de la matrice B
    B = np.zeros((Nx,Nx)) 

    for i in range(Nx-1): #mise a jour de la matrice B car U depend du temps 
        B[i,i]= delta_t*gamma*U[i]
        B[i+1,i]= 0
        B[i,i+1]= 0
    B[Nx-1,Nx-1]= delta_t*gamma*U[Nx-1]
    
    return A,B,F

#resolution de l'equation FKPP par differences finies, en stockant les valeurs des vecteurs u pour chaque temps 

def diff_finies(Nx,Nt) :
    """entree Nb de points de la discretisation en espace et en temps"""
    
    U = uini(np.linspace(0,1,Nx+2))
    U = U[1:-1] # on enlève la première et la dernière valeur du vecteur u 
    h = 1/(Nx+1)
    T = 1  # Temps final 
    delta_t = T/Nt

# matrice qui nous permettra de stocker les valeurs a chaque temps   
    M = np.zeros((Nx,Nt)) 
    
    M[:,0] = U # première colonne de la matrice
    
    A = np.zeros((Nx,Nx)) #construction de la matrice A
    
    for i in range(Nx-1):
        A[i,i] = 1 + (2*delta_t*nu)/h**2 - (delta_t*gamma)
        A[i+1,i]= -(delta_t*nu)/h**2
        A[i,i+1]= -(delta_t*nu)/h**2
    A[Nx-1,Nx-1]= 1 + (2*delta_t*nu)/h**2 - (delta_t*gamma)
    
    A = sp.csr_matrix(A) # conversion de la matrice A en une matrice creuse 
    
    B = np.zeros((Nx,Nx))# construction de la matrice B
    
    for k in range(1,Nt): # mise a jour de la matrice B car U depend du temps 
        for i in range(Nx):
            B[i,i]= delta_t*gamma*M[i,k-1]
        
        M[:,k] = spsolve((A+B),M[:,k-1]) # stockage des valeurs de la resolution du systeme lineaire 
    
    return M

#TEST de la solution exacte (solution approché sur un maillage tres fin) et de la solution approchee

Nt_ref, Nx_ref = 1000, 1000 # grillage fin

MRef = diff_finies(Nx_ref,Nt_ref) # solution exacte

Nt, Nx = 500, 500 # grillage grossier 

delta_x = 1/(Nx_ref + 1)

x = np.linspace(0,1,Nx+2)

M = diff_finies(Nx,Nt) # solution approchée

MRef_ech = MRef[::int((Nx_ref-1)/(Nx-1)),::int((Nt_ref-1)/(Nt-1))] # pour soustraitre deux tableaux de même taille
#le grillage fin etant un multiple du grillage grossier

#tester si les deux matrices de solution exacte et solution approchée coincident bien

x = np.linspace(0,1,Nx+2)
plt.plot(x[1:-1],M[:,-1],'bo',label='solution approchée')
plt.plot(x[1:-1],MRef_ech[:,-1],color = 'r',label='solution exacte')
plt.legend()
plt.show()


#Donnee necessaire pour le tracage des erreurs en norme 2 et infini

Nx_ref, Nt_ref = 1000, 1000

tab2 = [] # liste des valeurs des erreurs en norme 2
tabinf = [] # liste des valeurs des erreurs en norme infini
t = [] 
t_2 = []
MRef = diff_finies(Nx_ref,Nt_ref)
for N in [20,25,40,50,100,200,250,500]:# On trace par rapport à Nt et Nx etant des diviseurs de 1000
    M = diff_finies(N,N)
    MRef_ech = MRef[::int((Nx_ref)/(N)),::int(Nt_ref/N)]
    Diff = MRef_ech - M
    L_2 = np.sqrt(np.sum(Diff ** 2,axis=0)/N)
    L_inf = np.linalg.norm(Diff,np.inf,axis=0)
    Err2 = np.max(L_2)
    Errinf = np.max(L_inf,axis=0)
    tab2.append(Err2)
    tabinf.append(Errinf)
    t.append(N)
    t_2.append(1/N)

plt.plot(t,tab2,label = r'$\mathrm{Erreur\ \epsilon^{(2)}_{\Delta t,\Delta x}}$')
plt.plot(t,tabinf,label = r'$\mathrm{Erreur\ \epsilon^{(\infty)}_{\Delta t,\Delta x}}$')
plt.title('Courbes des erreurs $\mathrm{\epsilon^{(2)}_{\Delta t,\Delta x}},\epsilon^{(\infty)}_{\Delta t,\Delta x}}$')
plt.legend()
plt.show()

#Tracer en echelle loglog en fonction de 1/N et calculer la pente 

plt.loglog(t_2,tab2,label = '$\mathrm{Erreur\ \epsilon^{(2)}_{\Delta t,\Delta x}}$'+'en echelle logarithmique')
plt.loglog(t_2,tabinf,label = '$\mathrm{Erreur\ \epsilon^{(\infty)}_{\Delta t,\Delta x}}$'+'en echelle logarithmique')
plt.legend()
plt.savefig('figure en loglog')
plt.show()
a = np.polyfit(np.log(t_2),np.log(tab2),1)
b = np.polyfit(np.log(t_2),np.log(tabinf),1)
print(a,b)