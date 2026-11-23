# -*- coding: utf-8 -*-
"""
Created on Mon Dec 25 15:03:01 2023

@author: Sarah Keita
"""

import numpy as np
import matplotlib.pyplot as plt

def fonction_de_base(x, x1, x2, x3,N):
    """prend en entree la variable x, les points de discretisation xi, xi+1,xi-1 et le nb de pts N"""
    """renvoie les fonctions de base comme defini dans le cours"""
    #x1 = x_i-1
    #x2 = xi
    #x3 = x_i+1
    h = (b-a)/(N+1)
    if x>=x1 and x<=x2:
        return (x - x1)/h
    if x>=x2 and x<=x3 :
        return (x3 - x)/h
    else:
        return 0
    
def trapeze(f, a, b, M ):
    """prend en entree une fonction f, les points de l intervalle [a,b] ainsi que le nombre M correspondant au decoupage de l intervalle"""
    """retourne la methode des trapezes d approximation d integrale"""
    h = (b-a)/M
    t = 0
    for i in range(M):
        t += h*(f(a+i*h)+f(a+(i+1)*h))/2
    return t

def f(x):
    return 4 + 2*(4-x)*np.exp(x/2)

alpha = 8
beta = 0
epsilon = 1
Lambda = 0.5
b = 4
a = 0

def EF3(n):
    h = (b-a)/(n+1)
    F = np.zeros(n)
    A = np.zeros((n,n))
    for i in range(n-1):
        A[i,i]= epsilon*2/h
        A[i+1,i]= -Lambda/2 - epsilon/h
        A[i,i+1]= Lambda/2 - epsilon/h
        def produit(x):
            return f(x)*fonction_de_base(x,(i*h),(i+1)*h,(i+2)*h,n)
        F[i] = trapeze(produit,a,b,10*n)
    def produit(x):
        return f(x)*fonction_de_base(x,(n-2)*h,(n-1)*h,(n)*h,n)
    F[-1] = trapeze(produit,a,b,10*n) + beta * (1/h - Lambda/2)
    A[-1,-1]= epsilon*2/h
    F[0] += alpha*(epsilon/h + Lambda/2)
    U = np.linalg.solve(A,F) 
    U = np.concatenate([[alpha],U,[beta]])
 
    return U

n_values = [5,10,100,200,300,500]
for n in n_values:
    solution = EF3(n)
    y = solution
    x = np.linspace(a,b,n+2)
    plt.plot(x,y,label='solution approchee pour n='+str(n))
plt.legend()
plt.title('Solution approchee en fonction de differentes valeurs de n')
plt.show()
