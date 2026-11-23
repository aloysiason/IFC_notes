# -*- coding: utf-8 -*-
"""
Created on Mon Dec 25 14:43:12 2023

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

#etape 1 de diffusion

def df_diffusion(Nt,Nx,Un):
    """entree nb de points de la discretisation en espace et en temps et le vecteur u au temps n"""
        
    h = 1/(Nx+1)
    
    T=1. 
    
    dt = T/Nt
    
    # une manière d'écrire une matrice tridiagonale
    Q = ((1 + (dt*nu))*np.diag(np.ones(Nx),0)-((dt*nu)/2)*np.diag(np.ones(Nx-1),1)-((dt*nu)/2)*np.diag(np.ones(Nx-1),-1))/h**2
    
    Q = sp.csr_matrix(Q)
    
    U13 = spsolve(Q,Un)
    
    return U13

#etape de reaction



def etape_de_reaction(Nt,U13):
    
    dt = 1/Nt
    
    discriminant = (1 - dt * gamma)**2 + 4*dt*gamma*U13
    
    U23 = ((-(1 - dt * gamma) + np.sqrt(discriminant))/2*(dt*gamma)) #on choisit la solution 1 (avec le + dans la formule)
    
    return U23

#fonction qui réunit les deux etapes de diffusion reaction
#similaire à la fonction de l'exercice 1

def diffusion_reaction(Nx,Nt) :
    
    x = np.linspace(0,1,Nx+2)
    
    U = uini(x)
    
    U = U[1:-1] 
    
    h = 1/(Nx+1)
    
    M = np.zeros((Nx,Nt))
    
    M[:,0] = U 
    
    h = 1/(Nx+1)
    
    T=1. 
    
    dt = T/Nt
    
    Q = ((1 + (dt*nu))*np.diag(np.ones(Nx),0)-((dt*nu)/2)*np.diag(np.ones(Nx-1),1)-((dt*nu)/2)*np.diag(np.ones(Nx-1),-1))/h**2
   
    Q = sp.csr_matrix(Q)
    
    for k in range(1,Nt):  
        
        U13 = spsolve(Q,U) #demi pas diffusion
        U23 = etape_de_reaction(Nt,U13) #pas reaction
        Un1 = spsolve(Q,U23) #demi pas diffusion
        U = Un1
        M[:,k] = U
    
    return M

Nx_ref, Nt_ref = 1000, 1000

tab2 = []
tabinf = []
t = []
t_2 = []
MRef = diffusion_reaction(Nx_ref,Nt_ref)
for N in [20,40,50,100,200,250,500]:
    M = diffusion_reaction(N,N)
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
    
plt.plot(t,tab2,label = '$\mathrm{Erreur\ \epsilon^{(2)}_{\Delta t,\Delta x}}$')
plt.plot(t,tabinf,label = '$\mathrm{Erreur\ \epsilon^{(\infty)}_{\Delta t,\Delta x}}$')
plt.title('Courbes des erreurs $\mathrm{\epsilon^{(2)}_{\Delta t,\Delta x}},\epsilon^{(\infty)}_{\Delta t,\Delta x}}$ avec spliting de Strang')
plt.savefig('spliting_convergence')
plt.legend()
plt.show()

plt.loglog(t_2,tab2,label = '$\mathrm{Erreur\ \epsilon^{(2)}_{\Delta t,\Delta x}}$'+'en echelle logarithmique')
plt.loglog(t_2,tabinf,label = '$\mathrm{Erreur\ \epsilon^{(\infty)}_{\Delta t,\Delta x}}$'+'en echelle logarithmique')
plt.legend()
plt.savefig('spliting_convergence_loglog')
plt.show()
a = np.polyfit(np.log(t_2),np.log(tab2),1)
b = np.polyfit(np.log(t_2),np.log(tabinf),1)
print(a,b)