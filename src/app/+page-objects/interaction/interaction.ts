'use strict';

// Angular:
import { Injectable } from '@angular/core';

// Dependencies:
import { Action } from '../action/action';
import { Argument } from '../argument/argument';
import { ASTService, AST_PROVIDERS } from '../../shared/ast/ast.service';
import { Browser } from '../browser/browser';
import { Element } from '../element/element';
import { Factory } from '../../shared/factory/factory.interface';
import { Method, MethodFactory, METHOD_PROVIDERS } from '../method/method';

@Injectable()
export class InteractionFactory implements Factory<Interaction> {
    constructor (
        private astService: ASTService,
        private methodFactory: MethodFactory
    ) { }

    create (action: Action): Interaction {
        let instance = new Interaction(action);
        instance.setService(this.astService, this.methodFactory);
        return instance;
    }
}

export class Interaction {
    private _action: Action;
    private _element: Element | Browser;
    private _method;
    private _methodInstance: Method;

    private astService: ASTService;
    private methodFactory: MethodFactory;

    public get action (): Action {
        return this._action;
    }

    public get element (): Element | Browser {
        return this._element;
    }

    public set element (newElement: Element | Browser) {
        this._element = newElement;
        let [method] = this.element.methods
        this.method = method;
    }

    public get method () {
        return this._method;
    }

    public set method (newMethod) {
        this._method = newMethod;
        this._methodInstance = this.methodFactory.create(this, this.method);
    }

    public get methodInstance (): Method {
        return this._methodInstance;
    }

    public get arguments (): Array<Argument> {
        return this.methodInstance.arguments;
    }

    public get ast (): ESCodeGen.Statement {
        return this.toAST();
    }

    constructor (action: Action) {
        this._action = action;
    }

    public setService (astService: ASTService, methodFactory: MethodFactory): void {
        this.astService = astService;
        this.methodFactory = methodFactory;
    }

    private toAST (): ESCodeGen.Statement {
        let template = '<%= interaction %>';
        if (this.methodInstance.returns !== 'promise') {
            template = `new Promise(function (resolve) { resolve(${template}); });`;
        }

        let interaction = this.interactionAST();
        return this.astService.expression(template, { interaction });
    }

    private interactionAST () {
        let template = '<%= element %>';
        if (this.element.variableName !== 'browser') {
            template = `self.${template}`;
        }
        template += '.<%= method %>(%= argumentValues %);';

        let element = this.astService.identifier(this.element.variableName);
        let method = this.astService.identifier(this.methodInstance.name);
        let argumentValues = this.methodInstance.arguments.map(argument => argument.ast);

        return this.astService.expression(template, { element, method, argumentValues });
    }
}

export const INTERACTION_PROVIDERS = [
    InteractionFactory,
    AST_PROVIDERS,
    METHOD_PROVIDERS
];
