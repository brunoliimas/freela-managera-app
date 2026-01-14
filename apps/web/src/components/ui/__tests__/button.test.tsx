import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('deve renderizar o botão com texto', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByRole('button', { name: 'Clique aqui' })).toBeInTheDocument()
  })

  it('deve aplicar variante default por padrão', () => {
    render(<Button>Botão</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })

  it('deve aplicar variante destructive', () => {
    render(<Button variant="destructive">Excluir</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('deve aplicar variante outline', () => {
    render(<Button variant="outline">Cancelar</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border')
  })

  it('deve aplicar variante ghost', () => {
    render(<Button variant="ghost">Fechar</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-accent')
  })

  it('deve aplicar tamanho sm', () => {
    render(<Button size="sm">Pequeno</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-8')
  })

  it('deve aplicar tamanho lg', () => {
    render(<Button size="lg">Grande</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-10')
  })

  it('deve aplicar tamanho icon', () => {
    render(<Button size="icon">🔍</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('size-9')
  })

  it('deve estar desabilitado quando prop disabled é true', () => {
    render(<Button disabled>Desabilitado</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('deve chamar onClick quando clicado', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Clique</Button>)
    const button = screen.getByRole('button')

    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('não deve chamar onClick quando desabilitado', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick} disabled>Clique</Button>)
    const button = screen.getByRole('button')

    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('deve aplicar className customizado', () => {
    render(<Button className="custom-class">Botão</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('deve aceitar atributos HTML do botão', () => {
    render(<Button type="submit" name="submitButton">Enviar</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('name', 'submitButton')
  })

  it('deve ter data-slot="button"', () => {
    render(<Button>Botão</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-slot', 'button')
  })
})
