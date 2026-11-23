# -*- coding: utf-8 -*-
"""
Created on Mon Dec 25 14:53:59 2023

@author: Sarah Keita
"""

import numpy as np
import matplotlib.pyplot as plt 


def u(x):
    return np.sin(np.pi * x)

def normL2(N):
    """calcule la norme L2 de la fonction u-\pi_h u par la methode des rectangles"""
    
    delta = 1/N**2
    
    I = 0
    
    z = 0
    
    x = 0
    
    for i in range(N): #correspond a la somme sur les indices i de xi = 1/N
        for k in range(N): #correspond a la somme sur les indices k de zk = xi + k/N^2
        #on ajoute a I a chaque iteration l integrale de (u-\pi_h u)^2 sur l intervalle [zk,zk+1] 
        #que l'on sait calculer explicitement
        # I = (u(zk)-pi_u(zk))**2 ou pour pi_{u(zk)} on applique la forumule du cours
        
            I += ( u(z) - (u(x)*(z-(x+1/N))/(-1/N) + u(x+1/N)*(z-x)/(1/N) ) )**2 
            z += delta # z_k --> z_k+1
        x += 1/N # x_i --> x_i+1
    
    return np.sqrt(delta*I)

I = np.arange(5,100,5)
erreur = np.array([normL2(n) for n in I]) #stocker les valeurs des normes dans un tableau
plt.plot(I,erreur,label=r'$\mathrm{Erreur\ u-\pi_hu \ en \ norme \ L2}$')
plt.legend()
plt.show()

plt.loglog(I,erreur,label=r'$\mathrm{Erreur\ u-\pi_hu \ en \ norme \ L2 \ echelle \ logarithmique}$')
plt.legend()
plt.show()
np.polyfit(np.log(I),np.log(erreur),1)

def du(x):
    """derivee de u"""
    return np.pi*np.cos(np.pi*x)

def normL2_derivate(N):
    """Calcule la norme L2 de la derivee de u moins son interpole comme dans la precedente fonction"""
    delta = 1/N**2
    I = 0
    z = 0
    x = 0
    for i in range(N):
        for k in range(N):
            I += ( du(z) - ((u(x+1/N)-u(x))/(1/N) ))**2 
            z += delta #z_k --> z_k+1
        x += 1/N # x_i --> x_i+1
    return np.sqrt(delta*I)

I = np.arange(5,100,5)
erreur2 = np.array([normL2_derivate(n) for n in I])
plt.plot(I,erreur2,label=r'$\mathrm{Erreur\ \partial_x u-\partial_x\pi_hu \ en \ norme \ L2}$')
plt.legend()
plt.show()

plt.loglog(I,erreur2,label=r'$\mathrm{Erreur\ \partial_x u- \partial_x \pi_hu \ en \ norme \ L2 \ echelle \ logarithmique}$')
plt.legend()
plt.show()
np.polyfit(np.log(I),np.log(erreur2),1)