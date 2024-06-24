'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ date: true });

export async function createInvoice(formData: FormData) {




    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });


    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    await sql`
INSERT INTO invoices (customer_id, amount, status, date)
VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;



    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };
    // Test it out:
    console.log(rawFormData);

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');



}

export async function updateInvoice(formData: FormData) {
    // フォームから入力情報取得 id, customerId, amount, status
    const { id, customerId, amount, status } = UpdateInvoice.parse({
        id: formData.get('id'),
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // 金額 amount の変換処理
    const amountInCents = amount * 100;

    // 更新SQL実行 ( UPDATE テーブル名 SET 更新カラム.. WHERE 条件 )
    await sql`
      UPDATE invoices SET 
         customer_id = ${customerId}
         , amount = ${amountInCents}
         , status = ${status}
      WHERE
        id = ${id}
    `;

    // DB再取得(キャッシュクリア), リダイレクト
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}