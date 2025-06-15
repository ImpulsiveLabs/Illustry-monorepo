import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage
} from '@/components/ui/form';
import exp from 'constants';

const TestForm = ({ onSubmit}: {onSubmit : (data: any) => void}) => {
    const methods = useForm({
        defaultValues: {
            name: "",
        },
        mode: "onSubmit"
    })

    return (
        <Form {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <FormField
                    name= "name"
                    rules = {{ required: "Name is required" }}
                    render = {({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <input
                                    {...field}
                                    placeholder="Your name"
                                    data-testid="name-input"
                                />
                            </FormControl>
                            <FormDescription>This is your full name.</FormDescription>
                            <FormMessage></FormMessage>
                        </FormItem>
                    )}
                    />
                <button type="submit">Submit</button>
            </form>
        </Form>
    )
}
describe('Form', () => {
  it('renders validates and submits form', async () => {
    const handleSubmit = vi.fn();

    render(<TestForm onSubmit={handleSubmit} />);
    fireEvent.click(screen.getByText('Submit'));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({ name: 'John Doe' }, expect.anything());
    })
  });
});
